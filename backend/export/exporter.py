from fastapi import APIRouter, Body, Response, HTTPException
import csv
import io
from fpdf import FPDF

router = APIRouter(prefix="/export", tags=["export"])

@router.post("/{format}")
def export_file(format: str, data: dict = Body(...)):
    erblasser = data.get("erblasserName")
    erben = data.get("erben", [])
    ergebnisse = data.get("ergebnisse", {})

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow(["Erblasser", erblasser])
        writer.writerow(["Name", "Beziehung", "Erbquote (%)"])
        for erbe in erben:
            writer.writerow([
                erbe.get("name"),
                erbe.get("beziehung"),
                f"{ergebnisse.get(erbe['id'], 0):.2f}"
            ])
        content = output.getvalue().encode("utf-8")
        return Response(content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=erbfolge.csv"})

    elif format == "pdf":
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, f"Erbfolge-Berechnung für {erblasser}", ln=True)
        pdf.cell(0, 10, "", ln=True)
        pdf.cell(0, 10, "Name        Beziehung        Erbquote (%)", ln=True)
        for erbe in erben:
            pdf.cell(0, 10, f"{erbe.get('name','')}        {erbe.get('beziehung','')}        {ergebnisse.get(erbe['id'], 0):.2f}", ln=True)
        content = pdf.output(dest='S')
        return Response(content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=erbfolge.pdf"})

    elif format == "gedcom":
        gedcom = f"0 @I1@ INDI\n1 NAME {erblasser}\n"
        for idx, erbe in enumerate(erben, 1):
            gedcom += f"0 @I{idx+1}@ INDI\n1 NAME {erbe.get('name','')}\n1 NOTE Beziehung: {erbe.get('beziehung','')}, Erbquote: {ergebnisse.get(erbe['id'], 0):.2f}%\n"
        content = gedcom.encode("utf-8")
        return Response(content, media_type="text/plain", headers={"Content-Disposition": "attachment; filename=erbfolge.ged"})

    # Export für Erbpachtzins
    elif format == "csv-erbpachtzins":
        aktueller_zins = data.get("aktueller_zins")
        alter_index = data.get("alter_index")
        neuer_index = data.get("neuer_index")
        neuer_zins = data.get("neuer_zins")
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow(["Aktueller Zins (€)", aktueller_zins])
        writer.writerow(["Alter Index", alter_index])
        writer.writerow(["Neuer Index", neuer_index])
        writer.writerow(["Neuer Zins (€)", neuer_zins])
        content = output.getvalue().encode("utf-8")
        return Response(content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=erbpachtzins.csv"})

    elif format == "pdf-erbpachtzins":
        aktueller_zins = data.get("aktueller_zins")
        alter_index = data.get("alter_index")
        neuer_index = data.get("neuer_index")
        neuer_zins = data.get("neuer_zins")
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, "Erbpachtzins-Berechnung", ln=True)
        pdf.cell(0, 10, f"Aktueller Zins: {aktueller_zins} €", ln=True)
        pdf.cell(0, 10, f"Alter Index: {alter_index}", ln=True)
        pdf.cell(0, 10, f"Neuer Index: {neuer_index}", ln=True)
        pdf.cell(0, 10, f"Neuer Zins: {neuer_zins} €", ln=True)
        content = pdf.output(dest='S')
        return Response(content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=erbpachtzins.pdf"})

    # Export für GNotKG
    elif format == "csv-gnotkg":
        geschaeftswert = data.get("geschaeftswert")
        vorgangsart = data.get("vorgangsart")
        gebuehr = data.get("gebuehr")
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow(["Geschäftswert (€)", geschaeftswert])
        writer.writerow(["Vorgangsart", vorgangsart])
        writer.writerow(["Gebühr (€)", gebuehr])
        content = output.getvalue().encode("utf-8")
        return Response(content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=gnotkg.csv"})

    elif format == "pdf-gnotkg":
        geschaeftswert = data.get("geschaeftswert")
        vorgangsart = data.get("vorgangsart")
        gebuehr = data.get("gebuehr")
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, "GNotKG-Berechnung", ln=True)
        pdf.cell(0, 10, f"Geschäftswert: {geschaeftswert} €", ln=True)
        pdf.cell(0, 10, f"Vorgangsart: {vorgangsart}", ln=True)
        pdf.cell(0, 10, f"Gebühr: {gebuehr} €", ln=True)
        content = pdf.output(dest='S')
        return Response(content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=gnotkg.pdf"})

    else:
        raise HTTPException(status_code=400, detail="Unbekanntes Exportformat")
