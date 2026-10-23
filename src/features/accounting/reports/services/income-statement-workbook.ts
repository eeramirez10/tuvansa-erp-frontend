import type { Cell, Worksheet, PaperSize } from "exceljs"
import type { BranchIncomeStatements, FinancialIncomeStatementRow, IncomeStatement } from "@/features/accounting/reports/model"

type Row=FinancialIncomeStatementRow
const numberFormat='#,##0;[Red](-#,##0);"-"'
const percentFormat='0.00%;-0.00%;0.00%'
const mainSheetName="Reporte completo"
const sheetReference=(name:string)=>"'"+name.replaceAll("'","''")+"'!"

function orderedRows(reports:IncomeStatement[]):Row[] {
  const rows:Row[]=[]
  for(const report of reports){
    const source=report.financial!.rows
    source.forEach((row,index)=>{
      if(rows.some(value=>value.key===row.key))return
      const next=source.slice(index+1).find(value=>rows.some(known=>known.key===value.key))
      const position=next?rows.findIndex(value=>value.key===next.key):rows.length
      rows.splice(position,0,row)
    })
  }
  return rows
}
function effectiveRow(report:IncomeStatement,template:Row):Row {
  const actual=report.financial!.rows.find(row=>row.key===template.key)
  if(actual)return actual
  const income=report.financial!.rows.find(row=>row.key==="total-income")!
  return {...template,month:0,accumulated:0,monthPercent:income.month?0:null,accumulatedPercent:income.accumulated?0:null}
}
function formula(key:string,column:string,positions:Map<string,number>):string|undefined {
  const ref=(name:string)=>positions.has(name)?column+positions.get(name):"0"
  const sum=(keys:string[])=>"SUM("+keys.filter(key=>positions.has(key)).map(ref).join(",")+")"
  const formulas:Record<string,()=>string>={
    "total-sales":()=>sum(["sales","other-sales","returns","unclassified-income"]),
    "total-income":()=>ref("total-sales"),
    "total-cost":()=>sum(["cost-detail","other-costs"]),
    "gross-profit":()=>ref("total-income")+"-"+ref("total-cost"),
    "total-expenses":()=>sum(["expense-6002","expense-6003","expense-6001","expense-6006","expense-6007","unclassified-expenses"]),
    "operating-profit":()=>ref("gross-profit")+"-"+ref("total-expenses"),
    "before-other":()=>["operating-profit","depreciation","amortization","financing","other-expenses","other-products"].map(ref).join("-"),
    "before-tax":()=>ref("before-other")+"-"+ref("other"),
    "net-profit":()=>["before-tax","isr","ptu","additional-centralized"].map(ref).join("-"),
    "reconciliation":()=>ref("before-tax")+"-"+ref("erp-result"),
  }
  return formulas[key]?.()
}
function styleCell(cell:Cell,row:Row,numeric:boolean){
  const bold=row.kind==="total"||row.kind==="result"
  cell.font={name:"Arial Narrow",size:10,bold}
  cell.alignment={vertical:"middle",horizontal:numeric?"right":"left",wrapText:!numeric}
  if(numeric){
    cell.numFmt=numberFormat
    if(bold)cell.border={top:{style:"thin"},...(row.kind==="result"?{bottom:{style:"double" as const}}:{})}
  }
}
function header(sheet:Worksheet,company:string,title:string,lastColumn:number){
  sheet.mergeCells(1,1,1,Math.min(lastColumn,6));sheet.getCell(1,1).value=company
  sheet.mergeCells(2,1,2,Math.min(lastColumn,10));sheet.getCell(2,1).value=title
  for(const row of [1,2]){sheet.getCell(row,1).font={name:"Arial",size:11,bold:true};sheet.getRow(row).height=18}
  sheet.getColumn(1).width=48
  sheet.views=[{state:"frozen",xSplit:1,ySplit:6,zoomScale:90}]
  // OOXML paper size 1 is Letter; ExcelJS 4.4 typings omit that enum member.
  sheet.pageSetup={paperSize:1 as PaperSize,orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:1,margins:{left:.3,right:.3,top:.4,bottom:.4,header:.1,footer:.2},printTitlesRow:"1:6"}
  sheet.headerFooter={oddFooter:"Página &P de &N"}
}
function blockHeader(sheet:Worksheet,start:number,name:string,period:string){
  sheet.mergeCells(4,start,4,start+3);const label=sheet.getCell(4,start);label.value=name
  label.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFD9D9D9"}}
  label.border={top:{style:"thin"},bottom:{style:"thin"},left:{style:"thin"},right:{style:"thin"}}
  label.alignment={horizontal:"center"};label.font={name:"Arial",size:10,bold:true}
  sheet.mergeCells(5,start,5,start+1);sheet.getCell(5,start).value=period
  sheet.mergeCells(5,start+2,5,start+3);sheet.getCell(5,start+2).value="ACUMULADO A "+period
  for(let offset=0;offset<4;offset++){
    sheet.getColumn(start+offset).width=offset%2?12:18
    const cell=sheet.getCell(6,start+offset);cell.value=offset%2?"%":"IMPORTE";cell.font={name:"Arial",size:9,bold:true};cell.alignment={horizontal:"center"}
  }
  for(const index of [start,start+2]){const cell=sheet.getCell(5,index);cell.font={name:"Arial Narrow",size:9,bold:true};cell.alignment={horizontal:"center",wrapText:true}}
  sheet.getRow(5).height=26
  sheet.getCell(6,1).value="CONCEPTO"
}
function footer(sheet:Worksheet,firstRow:number,notices:string[],lastColumn:number){
  notices.forEach((notice,index)=>{
    const row=firstRow+index;sheet.mergeCells(row,1,row,Math.min(lastColumn,6));const cell=sheet.getCell(row,1)
    cell.value=notice;cell.font={name:"Arial",size:7,color:{argb:"FF444444"}};cell.alignment={wrapText:true,vertical:"top"};sheet.getRow(row).height=23
  })
  sheet.pageSetup.printArea="A1:"+sheet.getColumn(lastColumn).letter+(firstRow+notices.length)
}

export async function createIncomeStatementWorkbook(data:BranchIncomeStatements){
  const individual=data.branches.length===1&&data.consolidated===null
  if((!individual&&(data.branches.length!==7||!data.consolidated?.financial))||data.branches.some(item=>!item.report.financial))throw new Error("El reporte está incompleto.")
  const ExcelJS=await import("exceljs")
  const workbook=new ExcelJS.default.Workbook()
  workbook.creator="Tuvansa ERP";workbook.created=new Date(data.generatedAt);workbook.calcProperties.fullCalcOnLoad=true
  const reports=[...data.branches.map(item=>item.report),...(data.consolidated?[data.consolidated]:[])]
  const referenceReport=data.consolidated??data.branches[0]!.report
  const rows=orderedRows(reports),positions=new Map(rows.map((row,index)=>[row.key,index+7]))
  const period=new Date(referenceReport.asOf+"T00:00:00Z").toLocaleDateString("es-MX",{month:"long",year:"numeric",timeZone:"UTC"}).replace(" de "," ").toUpperCase()
  const title="ESTADO DE RESULTADOS AL MES DE "+period
  const main=workbook.addWorksheet(individual?(data.branches[0]!.branch.warehouseCode+" "+referenceReport.financial!.scopeLabel).replace(/[[\]:*?/\\]/g," ").slice(0,31):mainSheetName)
  const lastColumn=2+(reports.length-1)*5+3
  header(main,referenceReport.companyName,title,lastColumn)
  main.pageSetup.orientation=individual?"portrait":"landscape"
  main.pageSetup.printTitlesColumn="A:A"
  rows.forEach((row,index)=>{const cell=main.getCell(index+7,1);cell.value=row.label;styleCell(cell,row,false);main.getRow(index+7).height=row.kind==="spacer"?8:17})
  reports.forEach((report,block)=>{
    const start=2+block*5;blockHeader(main,start,report.financial!.scopeLabel,period)
    if(block<reports.length-1)main.getColumn(start+4).width=3
    rows.forEach((template,index)=>{
      if(template.kind==="spacer")return
      const row=effectiveRow(report,template),number=index+7
      for(const [offset,field] of [[0,"month"],[2,"accumulated"]] as const){
        const cell=main.getCell(number,start+offset),column=main.getColumn(start+offset).letter
        const value=row[field]
        const expression=!individual&&block===7 ? "SUM("+data.branches.map((_,i)=>main.getColumn(2+i*5+offset).letter+number).join(",")+")" : formula(row.key,column,positions)
        cell.value=expression?{formula:"ROUND("+expression+",2)",result:value??0}:value
        styleCell(cell,row,true)
        cell.border={...cell.border,...(offset===0?{left:{style:"thin" as const}}:{})}
        const pct=main.getCell(number,start+offset+1),ratio=offset===0?row.monthPercent:row.accumulatedPercent
        pct.value={formula:'IFERROR('+column+number+'/$'+column+'$'+positions.get("total-income")+',"")',result:ratio??""}
        styleCell(pct,row,true);pct.numFmt=percentFormat
        if(offset===2)pct.border={...pct.border,right:{style:"thin"}}
      }
    })
  })
  const notices=[...referenceReport.financial!.notices,...(individual?[]:["Los acumulados consolidados suman los acumulados de las siete sucursales. Importes calculados con centavos."])]
  footer(main,rows.length+9,notices,lastColumn)
  if(!individual)reports.forEach((report,index)=>{
    const sheetName=index===7?"Consolidado":(data.branches[index]!.branch.warehouseCode+" "+report.financial!.scopeLabel).replace(/[[\]:*?/\\]/g," ").slice(0,31)
    const sheet=workbook.addWorksheet(sheetName);header(sheet,report.companyName,title,5);blockHeader(sheet,2,report.financial!.scopeLabel,period)
    const ownRows=report.financial!.rows
    ownRows.forEach((row,i)=>{
      const number=i+7,sourceRow=positions.get(row.key)!
      sheet.getRow(number).height=row.kind==="spacer"?8:17
      const label=sheet.getCell(number,1);label.value=row.label;styleCell(label,row,false)
      if(row.kind==="spacer")return
      const values=[row.month,row.monthPercent,row.accumulated,row.accumulatedPercent]
      values.forEach((value,offset)=>{
        const cell=sheet.getCell(number,offset+2),column=main.getColumn(2+index*5+offset).letter
        cell.value={formula:sheetReference(mainSheetName)+column+sourceRow,result:value??""};styleCell(cell,row,true)
        if(offset%2)cell.numFmt=percentFormat
        if(offset===0)cell.border={...cell.border,left:{style:"thin"}}
        if(offset===3)cell.border={...cell.border,right:{style:"thin"}}
      })
    })
    footer(sheet,ownRows.length+9,report.financial!.notices,5)
  })
  return workbook
}
