import type ExcelJS from "exceljs"
import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { collectionCustomerLabel } from "@/features/sales/commissions/logic"

const money = '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'
const blue = { argb: "FFE0F2FE" }, green = { argb: "FFDCFCE7" }
function formula(sheet: ExcelJS.Worksheet, cell: string, expression: string, value: number | null) {
  sheet.getCell(cell).value = { formula: expression, result: value ?? "" }
}
function editable(cell: ExcelJS.Cell) { cell.fill = { type:"pattern",pattern:"solid",fgColor:blue }; cell.protection = { locked:false } }
function header(sheet: ExcelJS.Worksheet, row: number) {
  sheet.getRow(row).font = { bold:true }; sheet.getRow(row).fill = { type:"pattern",pattern:"solid",fgColor:green }
  sheet.getRow(row).alignment = { wrapText:true, vertical:"middle" }
}
function setup(sheet: ExcelJS.Worksheet, width: number) {
  sheet.columns = Array.from({ length:width }, () => ({ width:17 })); sheet.getColumn(1).width = 40
  sheet.views = [{ state:"frozen",ySplit:6 }]
  sheet.pageSetup = { orientation:"landscape",paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:"1:6" }
}

/** Layout recreated from the supplied workbook; no source file or personal data is bundled. */
export function addCollectionSettlementWorkbook(book: ExcelJS.Workbook, report: CollectionCommissions) {
  const summary = book.addWorksheet("Liquidación"), rates = book.addWorksheet("Tarifas"), payout = book.addWorksheet("Neto a recibir")
  setup(summary,19); setup(rates,7); setup(payout,7)
  const branchName = report.branchName
  const period = `${report.criteria.from} al ${report.criteria.to}`
  const mode = { additional:"Adicional",exclusive:"Sustituye",unconfirmed:"Por confirmar" }[report.settlement.bonusMode]
  summary.addRow([report.company]); summary.addRow(["COMISIONES POR COBRANZA"]); summary.addRow([`Sucursal: ${branchName} · Pagos ${period}`])
  summary.addRow(["Normal, clientes nuevos/recuperados y lento movimiento separados. Celdas azules: parámetros y reparto editables."])
  summary.addRow([report.settlement.ready ? "Liquidación calculada con los parámetros seleccionados." : "PENDIENTE: confirma modalidad del 1% y planes; los importes sin confirmar quedan vacíos."])
  summary.addRow(["Nombre","Cobranza","Costo","Utilidad bruta","% utilidad bruta","Flete entrega","Gratificaciones","Utilidad neta","% utilidad neta","% según tabla","% comisión","$ comisión",null,"Vendedor 1","Vendedor 2","Cotizador 1","Cotizador 2","Cotizador 3","Total a recibir"])
  for (let r=1;r<=5;r++) { summary.mergeCells(r,1,r,19); summary.getRow(r).height=r===4||r===5?32:24; summary.getRow(r).alignment={wrapText:true} }
  header(summary,6); summary.getRow(6).height=52
  rates.addRow(["TABULADOR PRINCIPAL CON SUELDO",null,null,null,"Tratamiento clientes 1%",mode]); rates.addRow(["Margen neto estrictamente mayor a 16%",null,null,null,"Bono de clientes",0.01]); rates.addRow(["Cobranza desde","% sobre utilidad neta"])
  report.settlement.salaryTiers.forEach(t=>rates.addRow([t.from,t.rate/100]))
  rates.getColumn(1).numFmt=money; rates.getColumn(2).numFmt="0.00%"; rates.getCell("F2").numFmt="0.00%"
  rates.getCell("F1").dataValidation={ type:"list",allowBlank:false,formulae:['"Por confirmar,Adicional,Sustituye"'] }; editable(rates.getCell("F1"))
  rates.getCell("A12").value="Límites inferiores del ejemplo. No se interpolan los intervalos de VLOOKUP."
  rates.getCell("A14").value="Segunda tabla del ejemplo (referencia, sin asignación automática)"
  rates.getCell("A15").value=270001; rates.getCell("B15").value=0.22; rates.getCell("C15").value=0.055
  rates.getCell("A16").value=500001; rates.getCell("B16").value=0.25; rates.getCell("C16").value=0.06
  for(const col of [2,3]) for(const row of [15,16]) rates.getCell(row,col).numFmt="0.00%"
  rates.getCell("A18").value="Cambiar una clasificación en Excel no cambia la marca del ERP. Se leyó CLITARJETA actual, no histórica."
  rates.getCell("A19").value="Los ajustes de costo/flete/gratificación de este libro no escriben en MySQL."
  rates.getColumn(5).width=34;rates.getColumn(6).width=25
  payout.addRow([report.company]); payout.addRow(["NETO A RECIBIR"]); payout.addRow([period]); payout.addRow(["Cada asignación identifica el agente de origen; una misma persona puede tener varias asignaciones."])
  payout.addRow(["Reparte cada componente al 100% en las hojas por agente. No se inventan nombres de beneficiarios."])
  payout.addRow(["Agente","Beneficiario","Rol","Comisión normal","Clientes 1%","PLM","Total"]); header(payout,6)
  for(let r=1;r<=5;r++) { payout.mergeCells(r,1,r,7);payout.getRow(r).alignment={wrapText:true};payout.getRow(r).height=28 }
  for(const col of [4,5,6,7]) payout.getColumn(col).numFmt=money
  const normalRows:number[]=[],bonusRows:number[]=[],lmRows:number[]=[]
  for (const agent of report.settlement.agents) {
    const safe=Array.from(agent.code+" "+agent.name).map(c=>"\\/*?:[]".includes(c)?" ":c).join("").replace(/^'+|'+$/g,"").slice(0,31) || "Agente"
    let name=safe, suffix=1;while(book.getWorksheet(name)) { const tail=" "+suffix++;name=safe.slice(0,31-tail.length)+tail }
    const sheet=book.addWorksheet(name), q="'"+name.replaceAll("'","''")+"'!";setup(sheet,22)
    const docs=report.invoices.filter(r=>r.agentCode===agent.code)
    sheet.addRow([report.company]);sheet.addRow([`${agent.code} · ${agent.name}`]);sheet.addRow([`Pagos ${period}`]);sheet.addRow(["Azul: costo manual, flete, gratificaciones, plan y reparto. Sin escritura al ERP."])
    sheet.addRow(["1% sobre el pago sin IVA para Nuevo o Viejo recuperado. La modalidad general se selecciona en Tarifas!F1."])
    sheet.addRow(["Cliente","Fecha docto","Fecha pago","Factura","Días","Subtotal","Devoluciones","Total","Pago positivo","Costo total","Costo real","Utilidad origen","% origen","Fletes origen","Clasificación cliente","LM","LM_VALOR","Base clientes 1%","% clientes","Bono clientes","Código cliente","Cobranza de cálculo (-PA)"])
    for(let r=1;r<=5;r++){sheet.mergeCells(r,1,r,22);sheet.getRow(r).height=25;sheet.getRow(r).alignment={wrapText:true}}
    header(sheet,6);sheet.getRow(6).height=40
    for(const doc of docs){
      const r=sheet.addRow([doc.customerName,new Date(doc.date+"T00:00:00Z"),new Date(doc.lastPaymentDate+"T00:00:00Z"),doc.number,doc.days,doc.subtotalAmount,doc.returnAmount,doc.totalAmount,doc.displayPaymentAmount,doc.cost,doc.realCost,doc.profit,doc.margin===null?null:doc.margin/100,doc.freightAmount,collectionCustomerLabel(doc.customerStatus),doc.lm,doc.lmAmount,null,doc.customerBonusRate===null?null:doc.customerBonusRate/100,null,doc.customerCode,doc.paymentAmount===null?null:-doc.paymentAmount]).number
      formula(sheet,"R"+r,`IF(OR(O${r}="Nuevo",O${r}="Viejo recuperado"),IF(ISNUMBER(V${r}),V${r},""),IF(OR(O${r}="Recurrente",O${r}="Inactivo"),0,""))`,doc.customerBonusBase)
      formula(sheet,"T"+r,`IF(COUNT(R${r},S${r})=2,R${r}*S${r},"")`,doc.customerBonus)
    }
    const last=sheet.rowCount, start=last+4, status=`O7:O${last}`
    const aggregate=(col:string)=>`IF('Tarifas'!$F$1="Sustituye",IF(COUNTIF(${status},"Sin clasificar")>0,"",IF(SUMPRODUCT(--(${status}<>"Nuevo"),--(${status}<>"Viejo recuperado"),--ISNUMBER(${col}7:${col}${last}))=COUNTIFS(${status},"<>Nuevo",${status},"<>Viejo recuperado"),ROUND(SUMIFS(${col}7:${col}${last},${status},"<>Nuevo",${status},"<>Viejo recuperado"),2),"")),IF(COUNT(${col}7:${col}${last})=${docs.length},ROUND(SUM(${col}7:${col}${last}),2),""))`
    const row=(offset:number,label:string)=>{sheet.getCell(start+offset,1).value=label;return "B"+(start+offset)}
    row(0,"NOMBRE");sheet.getCell(start,2).value=agent.name
    const pay=row(1,"COBRANZA NORMAL"), sourceCost=row(2,"COSTO DE ORIGEN"), manual=row(3,"COSTO MANUAL (OPCIONAL)"), cost=row(4,"COSTO APLICADO"),gross=row(5,"UTILIDAD BRUTA"),grossMargin=row(6,"% UTILIDAD ANTES DE FLETE/GRATIFICACIONES"),freight=row(7,"FLETE ENTREGA"),grat=row(8,"GRATIFICACIONES"),net=row(9,"UTILIDAD NETA"),netMargin=row(10,"% UTILIDAD NETA"),plan=row(11,"PLAN"),fixed=row(12,"% FIJO"),rate=row(13,"% COMISIÓN"),regular=row(14,"COMISIÓN NORMAL"),bonusBase=row(15,"BASE CLIENTES 1%"),bonusRate=row(16,"% CLIENTES NUEVOS/RECUPERADOS"),bonus=row(17,"BONO CLIENTES"),includeLm=row(18,"INCLUIR PLM"),lm=row(19,"BONO PRODUCTO LENTO MOVIMIENTO"),total=row(20,"TOTAL COMISIÓN")
    formula(sheet,pay,aggregate("V"),agent.payment);formula(sheet,sourceCost,aggregate(agent.config.costBasis==="total"?"J":"K"),agent.sourceCost)
    sheet.getCell(manual).value=agent.config.costOverride;editable(sheet.getCell(manual));formula(sheet,cost,`IF(ISNUMBER(${manual}),${manual},IF(ISNUMBER(${sourceCost}),${sourceCost},""))`,agent.cost)
    formula(sheet,gross,`IF(COUNT(${pay},${cost})=2,ROUND(${pay}-${cost},2),"")`,agent.grossProfit)
    formula(sheet,grossMargin,`IF(AND(ISNUMBER(${gross}),${pay}<>0),${gross}/${pay},"")`,agent.grossMargin===null?null:agent.grossMargin/100)
    sheet.getCell(freight).value=agent.freight;sheet.getCell(grat).value=agent.gratuities
    for(const cell of [freight,grat,fixed])editable(sheet.getCell(cell))
    formula(sheet,net,`IF(ISNUMBER(${gross}),ROUND(${gross}-${freight}-${grat},2),"")`,agent.netProfit)
    formula(sheet,netMargin,`IF(AND(ISNUMBER(${net}),${pay}<>0),${net}/${pay},"")`,agent.netMargin===null?null:agent.netMargin/100)
    sheet.getCell(plan).value={salary:"Tabulador",fixed:"Fijo",unconfirmed:"Por confirmar"}[agent.config.plan];sheet.getCell(plan).dataValidation={type:"list",allowBlank:false,formulae:['"Por confirmar,Tabulador,Fijo"']};editable(sheet.getCell(plan))
    sheet.getCell(fixed).value=agent.config.fixedRate/100
    const monthly=report.criteria.from.slice(0,7)===report.criteria.to.slice(0,7)?"TRUE":"FALSE"
    formula(sheet,rate,`IF(${plan}="Fijo",${fixed},IF(AND(${plan}="Tabulador",${monthly},COUNT(${pay},${net})=2),IF(AND(${pay}>0,${net}*100>${pay}*16),VLOOKUP(${pay},'Tarifas'!$A$4:$B$10,2,TRUE),0),""))`,agent.rate===null?null:agent.rate/100)
    formula(sheet,regular,`IF(AND('Tarifas'!$F$1<>"Por confirmar",COUNT(${net},${rate})=2),ROUND(${net}*${rate},2),"")`,agent.regularCommission)
    formula(sheet,bonusBase,`IF(COUNT(R7:R${last})=${docs.length},ROUND(SUM(R7:R${last}),2),"")`,agent.customerBonusBase)
    sheet.getCell(bonusRate).value=0.01;formula(sheet,bonus,`IF(COUNT(T7:T${last})=${docs.length},ROUND(SUM(T7:T${last}),2),"")`,agent.customerBonus)
    sheet.getCell(includeLm).value=agent.config.includeLm?"Sí":"No";sheet.getCell(includeLm).dataValidation={type:"list",allowBlank:false,formulae:['"Sí,No"']};editable(sheet.getCell(includeLm))
    formula(sheet,lm,`IF(${includeLm}="No",0,IF(COUNT(Q7:Q${last})=${docs.length},ROUND(SUM(Q7:Q${last}),2),""))`,agent.lmBonus)
    formula(sheet,total,`IF(COUNT(${regular},${bonus},${lm})=3,ROUND(SUM(${regular},${bonus},${lm}),2),"")`,agent.totalCommission)
    for(const cell of [grossMargin,netMargin,fixed,rate,bonusRate])sheet.getCell(cell).numFmt="0.00%"
    for(const offset of [1,2,3,4,5,7,8,9,14,15,17,19,20])sheet.getCell(start+offset,2).numFmt=money
    for(const col of [2,3])sheet.getColumn(col).numFmt="dd/mm/yyyy"
    // Restore financial block formatting after date column defaults.
    for(let r=start;r<=start+20;r++)sheet.getCell(r,2).numFmt=[6,10,12,13,16].includes(r-start)?"0.00%":money
    for(const r of [start,start+11,start+18])sheet.getCell(r,2).numFmt="General"
    for(const col of [6,7,8,9,10,11,12,14,17,18,20,22])sheet.getColumn(col).numFmt=money
    for(let r=7;r<=last;r++)sheet.getCell(r,20).numFmt='"$"#,##0.0000'
    for(const col of [13,19])sheet.getColumn(col).numFmt="0.00%"
    const split=start+24,endSplit=split+5
    sheet.getRow(split).values=["BENEFICIARIO","ROL","% NORMAL","% CLIENTES","% PLM","COMISIÓN NORMAL","CLIENTES 1%","PLM","TOTAL A RECIBIR"];header(sheet,split)
    for(let n=0;n<5;n++){
      const r=split+1+n,primary=n===0;sheet.getRow(r).values=[primary?agent.name:"",n<2?"Vendedor":"Cotizador",primary?1:0,primary?1:0,primary?1:0]
      for(let col=1;col<=5;col++)editable(sheet.getCell(r,col))
      for(const col of [3,4,5]){sheet.getCell(r,col).numFmt="0.00%";sheet.getCell(r,col).dataValidation={type:"decimal",operator:"between",allowBlank:false,formulae:[0,1]}}
      for(const [col,share,base,cached]of [[6,"C",regular,agent.regularCommission],[7,"D",bonus,agent.customerBonus],[8,"E",lm,agent.lmBonus]] as const){
        const shares=`${share}${split+1}:${share}${endSplit}`;const prev=n===0?"0":`SUM(${share}${split+1}:${share}${r-1})`
        formula(sheet,`${String.fromCharCode(64+col)}${r}`,`IF(AND(ISNUMBER(${base}),ABS(SUM(${shares})-1)<0.000001,SUMPRODUCT(--($A$${split+1}:$A$${endSplit}=""),--(${shares}>0))=0),ROUND(${base}*SUM(${share}${split+1}:${share}${r})/SUM(${shares}),2)-ROUND(${base}*${prev}/SUM(${shares}),2),"")`,cached===null?null:primary?cached:0)
      }
      formula(sheet,"I"+r,`IF(COUNT(F${r}:H${r})=3,ROUND(SUM(F${r}:H${r}),2),"")`,agent.totalCommission===null?null:primary?agent.totalCommission:0)
      for(const col of [6,7,8,9])sheet.getCell(r,col).numFmt=money
      const pr=payout.addRow([agent.code,null,n<2?"Vendedor":"Cotizador"]).number
      payout.getCell(pr,2).value={formula:`IF(${q}A${r}="","",${q}A${r})`,result:primary?agent.name:""}
      for(const [col,target,cached]of [[4,"F",agent.regularCommission],[5,"G",agent.customerBonus],[6,"H",agent.lmBonus],[7,"I",agent.totalCommission]] as const)formula(payout,`${String.fromCharCode(64+col)}${pr}`,`IF(ISNUMBER(${q}${target}${r}),${q}${target}${r},"")`,cached===null?null:primary?cached:0)
    }
    sheet.getCell(endSplit+2,1).value="Repartir cada componente al 100%. Si falta un nombre con porcentaje o la suma no es 100%, sus pagos quedan pendientes."
    sheet.mergeCells(endSplit+2,1,endSplit+2,9);sheet.getRow(endSplit+2).alignment={wrapText:true};sheet.getRow(endSplit+2).height=30
    const head=summary.addRow([`${agent.code} · ${agent.name}`]).number;header(summary,head)
    for(let n=0;n<5;n++)summary.getCell(head,14+n).value={formula:`IF(${q}A${split+1+n}="","",${q}A${split+1+n})`,result:n===0?agent.name:""}
    const normal=summary.addRow(["Comisión normal"]).number,bonusRow=summary.addRow(["Clientes nuevos / recuperados"]).number,lmRow=summary.addRow(["Producto lento movimiento"]).number
    normalRows.push(normal);bonusRows.push(bonusRow);lmRows.push(lmRow)
    for(const [col,ref,cached]of [[2,pay,agent.payment],[3,cost,agent.cost],[4,gross,agent.grossProfit],[5,grossMargin,agent.grossMargin===null?null:agent.grossMargin/100],[6,freight,agent.freight],[7,grat,agent.gratuities],[8,net,agent.netProfit],[9,netMargin,agent.netMargin===null?null:agent.netMargin/100],[10,rate,agent.rate===null?null:agent.rate/100],[11,rate,agent.rate===null?null:agent.rate/100],[12,regular,agent.regularCommission]] as const)formula(summary,`${String.fromCharCode(64+col)}${normal}`,`IF(ISNUMBER(${q}${ref}),${q}${ref},"")`,cached)
    formula(summary,"B"+bonusRow,`${q}${bonusBase}`,agent.customerBonusBase);summary.getCell(bonusRow,11).value=0.01;formula(summary,"L"+bonusRow,`${q}${bonus}`,agent.customerBonus)
    summary.getCell(lmRow,11).value=0.01;formula(summary,"L"+lmRow,`${q}${lm}`,agent.lmBonus)
    for(const [r,column,cached]of [[normal,"F",agent.regularCommission],[bonusRow,"G",agent.customerBonus],[lmRow,"H",agent.lmBonus]] as const){
      for(let n=0;n<5;n++)formula(summary,`${String.fromCharCode(78+n)}${r}`,`IF(ISNUMBER(${q}${column}${split+1+n}),${q}${column}${split+1+n},"")`,cached===null?null:n===0?cached:0)
      formula(summary,"S"+r,`IF(COUNT(N${r}:R${r})=5,ROUND(SUM(N${r}:R${r}),2),"")`,cached)
    }
  }
  const end=summary.addRow(["TOTAL"]).number;header(summary,end)
  const summation=(rows:number[],col:string)=>rows.length?`SUM(${rows.map(r=>col+r).join(",")})`:"0"
  const t=report.settlement.totals
  const payoutEnd=payout.rowCount,payoutTotal=payout.addRow(["TOTAL"]).number;header(payout,payoutTotal)
  for(const [col,cached]of [[4,t.regularCommission],[5,t.customerBonus],[6,t.lmBonus],[7,t.totalCommission]] as const){
    const letter=String.fromCharCode(64+col)
    formula(payout,letter+payoutTotal,`IF(COUNT(${letter}7:${letter}${payoutEnd})=${report.settlement.agents.length*5},ROUND(SUM(${letter}7:${letter}${payoutEnd}),2),"")`,cached)
  }
  for(const [col,cached]of [[2,t.payment],[3,t.cost],[4,t.grossProfit],[6,t.freight],[7,t.gratuities],[8,t.netProfit]] as const)formula(summary,`${String.fromCharCode(64+col)}${end}`,`ROUND(${summation(normalRows,String.fromCharCode(64+col))},2)`,cached)
  const every=[...normalRows,...bonusRows,...lmRows]
  for(const col of [12,14,15,16,17,18,19])formula(summary,`${String.fromCharCode(64+col)}${end}`,`IF(COUNT(${every.map(r=>String.fromCharCode(64+col)+r).join(",")})=${every.length},ROUND(${summation(every,String.fromCharCode(64+col))},2),"")`,t.totalCommission===null?null:[12,14,19].includes(col)?t.totalCommission:0)
  for(const col of [2,3,4,6,7,8,12,14,15,16,17,18,19])summary.getColumn(col).numFmt=money
  for(const col of [5,9,10,11])summary.getColumn(col).numFmt="0.00%"
  summary.getCell("A5").value={formula:`IF(AND('Tarifas'!F1<>"Por confirmar",COUNT(${every.map(r=>"S"+r).join(",")})=${every.length}),"Liquidación calculada con los parámetros seleccionados.","PENDIENTE: confirma modalidad del 1%, planes, marcas y reparto.")`,result:report.settlement.ready?"Liquidación calculada con los parámetros seleccionados.":"PENDIENTE: confirma modalidad del 1%, planes, marcas y reparto."}
  summary.addRow([]);summary.addRow(["OTROS / REFERENCIA DEL EJEMPLO (NO INCLUIDO EN EL TOTAL AUTOMÁTICO)"])
  const extra=summary.addRow(["Base manual",0,"Umbral",4500000,"Tasa",0.015,"Importe adicional"]).number
  for(const c of [2,4,6])editable(summary.getCell(extra,c));summary.getCell(extra,6).numFmt="0.00%"
  formula(summary,"H"+extra,`ROUND(MAX(B${extra}-D${extra},0)*F${extra},2)`,0)
}
