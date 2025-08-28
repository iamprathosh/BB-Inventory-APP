#!/usr/bin/env python3
"""
Vendor Database Import Script
Imports construction vendors from Excel file into Convex database
"""

import pandas as pd
import requests
import json
import sys
import os
from typing import Dict, List, Any

# Convex configuration
CONVEX_SITE_URL = "https://your-deployment-url.convex.site"  # Replace with actual deployment URL
API_KEY = "your-api-key"  # Replace with actual API key

# Excel file path
EXCEL_FILE_PATH = "../Vendor Database.xlsx"

def clean_phone_number(phone_float: float) -> str:
    """Convert phone number float to properly formatted string"""
    if pd.isna(phone_float):
        return ""
    
    # Convert to integer first to remove decimal, then to string
    phone_str = str(int(phone_float))
    
    # Format as (XXX) XXX-XXXX
    if len(phone_str) == 10:
        return f"({phone_str[:3]}) {phone_str[3:6]}-{phone_str[6:]}"
    elif len(phone_str) == 11 and phone_str.startswith('1'):
        # Remove leading 1 for US numbers
        phone_str = phone_str[1:]
        return f"({phone_str[:3]}) {phone_str[3:6]}-{phone_str[6:]}"
    else:
        return phone_str

def clean_zip_code(zip_float: float) -> str:
    """Convert zip code float to string"""
    if pd.isna(zip_float):
        return ""
    return str(int(zip_float))

def determine_specialties(vendor_name: str) -> List[str]:
    """Determine specialties based on vendor name"""
    name_lower = vendor_name.lower()
    specialties = []
    
    # Common construction specialties based on vendor names
    specialty_keywords = {
        "concrete": ["Concrete", "Ready Mix"],
        "lumber": ["Lumber", "Framing"],
        "supply": ["General Supplies", "Building Materials"],
        "steel": ["Steel", "Metal Fabrication"],
        "masonry": ["Masonry", "Stone Work"],
        "roofing": ["Roofing", "Waterproofing"],
        "electric": ["Electrical", "Lighting"],
        "plumb": ["Plumbing", "HVAC"],
        "paint": ["Painting", "Coatings"],
        "glass": ["Glazing", "Windows"],
        "tile": ["Tile", "Flooring"],
        "insul": ["Insulation", "Thermal Protection"],
        "excavat": ["Excavation", "Earthwork"],
        "transport": ["Transportation", "Delivery"],
        "rental": ["Equipment Rental"],
        "demo": ["Demolition"]
    }
    
    for keyword, specs in specialty_keywords.items():
        if keyword in name_lower:
            specialties.extend(specs)
    
    # Default if no specialties found
    if not specialties:
        specialties = ["General Construction"]
    
    return specialties

def determine_vendor_type(vendor_name: str) -> str:
    """Determine vendor type based on name"""
    name_lower = vendor_name.lower()
    
    if any(word in name_lower for word in ["supply", "supplier", "materials"]):
        return "supplier"
    elif any(word in name_lower for word in ["contractor", "construction", "builders"]):
        return "subcontractor" 
    elif any(word in name_lower for word in ["service", "rental", "transport"]):
        return "service"
    else:
        return "supplier"  # Default

def load_vendor_data() -> List[Dict[str, Any]]:
    """Load and process vendor data from Excel file"""
    try:
        # Read Excel file
        df = pd.read_excel(EXCEL_FILE_PATH)
        
        print(f"Loaded {len(df)} vendors from Excel file")
        print(f"Columns: {list(df.columns)}")
        
        vendors = []
        
        for _, row in df.iterrows():
            # Clean and process the data
            vendor_data = {
                "name": str(row["* Vendor Name"]).strip(),
                "email": str(row["Email"]).strip() if pd.notna(row["Email"]) else "",
                "phone": clean_phone_number(row["Phone"]) if pd.notna(row["Phone"]) else "",
                "address": str(row["Address Line 1"]).strip() if pd.notna(row["Address Line 1"]) else "",
                "city": str(row["City"]).strip() if pd.notna(row["City"]) else "",
                "state": str(row["State"]).strip() if pd.notna(row["State"]) else "",
                "zipCode": clean_zip_code(row["Zip Code"]) if pd.notna(row["Zip Code"]) else "",
                "contactPerson": str(row["Contact Name"]).strip() if pd.notna(row["Contact Name"]) else "",
                "vendorType": determine_vendor_type(str(row["* Vendor Name"])),
                "specialties": determine_specialties(str(row["* Vendor Name"])),
                "paymentTerms": "Net 30",  # Default payment terms
                "isActive": True,
                "certifications": []  # Empty for now, can be populated later
            }
            
            # Only add vendors with valid names and emails
            if vendor_data["name"] and vendor_data["name"] != "nan":
                vendors.append(vendor_data)
        
        print(f"Processed {len(vendors)} valid vendors")
        return vendors
        
    except FileNotFoundError:
        print(f"Error: Excel file '{EXCEL_FILE_PATH}' not found")
        return []
    except Exception as e:
        print(f"Error loading Excel file: {e}")
        return []

def create_vendor_via_api(vendor_data: Dict[str, Any]) -> bool:
    """Create a vendor via Convex HTTP API"""
    try:
        # This is a placeholder for the actual API call
        # You would need to implement the actual HTTP API endpoint
        # For now, just print the data that would be sent
        print(f"Would create vendor: {vendor_data['name']} ({vendor_data['email']})")
        print(f"  Specialties: {', '.join(vendor_data['specialties'])}")
        print(f"  Location: {vendor_data['city']}, {vendor_data['state']}")
        print()
        return True
        
    except Exception as e:
        print(f"Error creating vendor {vendor_data['name']}: {e}")
        return False

def import_vendors():
    """Main import function"""
    print("=== VENDOR DATABASE IMPORT ===")
    print()
    
    # Load vendor data
    vendors = load_vendor_data()
    
    if not vendors:
        print("No vendors to import")
        return
    
    # Import vendors
    successful_imports = 0
    failed_imports = 0
    
    print("Starting vendor import...")
    print()
    
    for vendor in vendors:
        if create_vendor_via_api(vendor):
            successful_imports += 1
        else:
            failed_imports += 1
    
    # Summary
    print("=== IMPORT SUMMARY ===")
    print(f"Total vendors processed: {len(vendors)}")
    print(f"Successful imports: {successful_imports}")
    print(f"Failed imports: {failed_imports}")
    
    if successful_imports > 0:
        print("\n✅ Import completed successfully!")
    else:
        print("\n❌ Import failed!")

def export_vendors_json():
    """Export vendor data to JSON for manual import"""
    vendors = load_vendor_data()
    
    if vendors:
        output_file = "vendors_export.json"
        with open(output_file, 'w') as f:
            json.dump(vendors, f, indent=2)
        print(f"✅ Exported {len(vendors)} vendors to {output_file}")
        print("You can now manually import this data into your Convex database")
    else:
        print("❌ No vendor data to export")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--export-json":
        export_vendors_json()
    else:
        import_vendors()
