
from typing import Dict, List, Any, Optional
import re
import uuid

def parse_gedcom_content(content: str) -> Dict[str, Any]:
    """
    Parse a GEDCOM file content and return structured data
    for the Erbfolge calculator
    """
    lines = content.split('\n')
    individuals = {}
    families = {}
    current_entity = None
    current_type = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Parse GEDCOM line format: LEVEL [XREF] TAG [VALUE]
        parts = re.match(r'(\d+)\s+(?:@(\w+)@)?\s*(\w+)(?:\s+(.*))?', line)
        if not parts:
            continue
            
        level, xref, tag, value = parts.groups()
        level = int(level)
        
        if level == 0:
            if tag == "INDI" and xref:
                # Individual record
                current_type = "INDI"
                current_entity = {"id": xref, "type": "individual"}
                individuals[xref] = current_entity
            elif tag == "FAM" and xref:
                # Family record
                current_type = "FAM"
                current_entity = {"id": xref, "type": "family", "children": []}
                families[xref] = current_entity
            else:
                current_type = None
                current_entity = None
        elif current_entity:
            # Add data to current entity
            if current_type == "INDI":
                if tag == "NAME" and value:
                    # Parse name formats like "John /Doe/" or "John Doe"
                    name_parts = re.match(r'(.*?)(?:/(.*)/)?(.*)?', value)
                    if name_parts:
                        first, last, suffix = name_parts.groups()
                        current_entity["first_name"] = first.strip() if first else ""
                        current_entity["last_name"] = last.strip() if last else ""
                elif tag == "BIRT":
                    current_entity["birth"] = {}
                elif tag == "DEAT":
                    current_entity["death"] = {}
                elif tag == "DATE" and value:
                    # Check parent context (birth or death)
                    if "birth" in current_entity and not current_entity.get("birth", {}).get("date"):
                        current_entity["birth"]["date"] = normalize_date(value)
                    elif "death" in current_entity and not current_entity.get("death", {}).get("date"):
                        current_entity["death"]["date"] = normalize_date(value)
                elif tag == "FAMC" and value:
                    # Child in family
                    current_entity["child_in_family"] = value.strip("@")
                elif tag == "FAMS" and value:
                    # Spouse in family
                    current_entity["spouse_in_family"] = value.strip("@")
            elif current_type == "FAM":
                if tag == "HUSB" and value:
                    current_entity["husband"] = value.strip("@")
                elif tag == "WIFE" and value:
                    current_entity["wife"] = value.strip("@")
                elif tag == "CHIL" and value:
                    current_entity["children"].append(value.strip("@"))
    
    # Convert to Erbfolge format
    erben = []
    erblasser_name = "Erblasser"  # Default name
    
    # First individual as default erblasser
    if individuals and list(individuals.keys()):
        first_indi = individuals[list(individuals.keys())[0]]
        erblasser_name = f"{first_indi.get('first_name', '')} {first_indi.get('last_name', '')}".strip()
    
    # Process families to determine relationships
    for fam_id, family in families.items():
        husband_id = family.get("husband")
        wife_id = family.get("wife")
        children = family.get("children", [])
        
        # Add spouse relationship
        if husband_id and wife_id and husband_id in individuals and wife_id in individuals:
            spouse = individuals[wife_id]
            erben.append({
                "id": str(uuid.uuid4()),
                "beziehung": "ehepartner",
                "vorname": spouse.get("first_name", ""),
                "nachname": spouse.get("last_name", ""),
                "geburtsdatum": spouse.get("birth", {}).get("date", ""),
                "sterbedatum": spouse.get("death", {}).get("date", "")
            })
        
        # Add children relationship
        for child_id in children:
            if child_id in individuals:
                child = individuals[child_id]
                erben.append({
                    "id": str(uuid.uuid4()),
                    "beziehung": "kind",
                    "vorname": child.get("first_name", ""),
                    "nachname": child.get("last_name", ""),
                    "geburtsdatum": child.get("birth", {}).get("date", ""),
                    "sterbedatum": child.get("death", {}).get("date", "")
                })
    
    # Add other individuals as relatives
    added_ids = set([person.get("id", "") for person in erben])
    for indi_id, individual in individuals.items():
        if indi_id not in added_ids:
            erben.append({
                "id": str(uuid.uuid4()),
                "beziehung": "geschwister",  # Default to siblings for simplicity
                "vorname": individual.get("first_name", ""),
                "nachname": individual.get("last_name", ""),
                "geburtsdatum": individual.get("birth", {}).get("date", ""),
                "sterbedatum": individual.get("death", {}).get("date", "")
            })
    
    return {
        "personen": erben,
        "erblasserName": erblasser_name
    }

def normalize_date(date_string: str) -> str:
    """
    Attempt to normalize GEDCOM date formats into YYYY-MM-DD
    """
    # Try to parse common date formats
    date_string = date_string.strip()
    
    # Handle ISO format
    iso_match = re.match(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', date_string)
    if iso_match:
        year, month, day = iso_match.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    
    # Handle GEDCOM format like "12 JAN 1980"
    gedcom_match = re.match(r'(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})', date_string)
    if gedcom_match:
        day, month, year = gedcom_match.groups()
        month_map = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
            'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        }
        month_num = month_map.get(month.upper(), '01')
        return f"{year}-{month_num}-{day.zfill(2)}"
    
    # If only year is available
    year_match = re.match(r'\b(\d{4})\b', date_string)
    if year_match:
        return f"{year_match.group(1)}-01-01"
    
    # Return as is if no matches
    return date_string
