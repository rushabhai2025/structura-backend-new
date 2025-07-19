from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import logging
import os
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/uploadfile", tags=["File Upload"])

@router.post("/")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    category: str = Form(...)
):
    """
    Upload multiple PDF files with category selection
    
    Args:
        files: List of PDF files to upload
        category: Category for processing (technical, commercial, basic, or all)
    
    Returns:
        JSON response with processing results for each file
    """
    try:
        # Validate category
        valid_categories = ["technical", "commercial", "basic", "all"]
        if category.lower() not in valid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        
        # Validate files
        if not files:
            raise HTTPException(
                status_code=400,
                detail="No files provided"
            )
        
        # Process each file
        results = []
        for file in files:
            # Validate file type
            if not file.filename.lower().endswith('.pdf'):
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "Only PDF files are supported"
                })
                continue
            
            # Validate file size (max 10MB)
            if file.size and file.size > 10 * 1024 * 1024:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "File size exceeds 10MB limit"
                })
                continue
            
            try:
                # For now, return dummy extracted content
                # In production, this would call the actual extraction functions
                extracted_data = {
                    "filename": file.filename,
                    "category": category,
                    "upload_time": datetime.now().isoformat(),
                    "file_size": file.size,
                    "extracted_fields": {
                        "technical": {
                            "machine_model": "PF1-2000",
                            "forming_area": "2000x1500mm",
                            "heating_power": "50kW",
                            "vacuum_pressure": "0.8 bar"
                        },
                        "commercial": {
                            "base_price": "$150,000",
                            "lead_time": "8-12 weeks",
                            "warranty_period": "2 years",
                            "payment_terms": "30% advance, 70% before shipment"
                        },
                        "basic": {
                            "machine_description": "Advanced thermoforming machine for automotive applications",
                            "applications": "Automotive, packaging, medical devices",
                            "automation_level": "Fully automated with robotic loading"
                        }
                    }
                }
                
                # Filter data based on category
                if category.lower() != "all":
                    extracted_data["extracted_fields"] = {
                        category: extracted_data["extracted_fields"].get(category, {})
                    }
                
                results.append({
                    "filename": file.filename,
                    "status": "success",
                    "data": extracted_data
                })
                
                logger.info(f"Successfully processed {file.filename} for category: {category}")
                
            except Exception as e:
                logger.error(f"Error processing {file.filename}: {str(e)}")
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": f"Processing error: {str(e)}"
                })
        
        # Calculate summary
        successful_files = [r for r in results if r["status"] == "success"]
        error_files = [r for r in results if r["status"] == "error"]
        
        return JSONResponse({
            "success": True,
            "category": category,
            "total_files": len(files),
            "successful_files": len(successful_files),
            "error_files": len(error_files),
            "results": results,
            "summary": {
                "total_processed": len(results),
                "successful": len(successful_files),
                "failed": len(error_files),
                "processing_time": datetime.now().isoformat()
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload_multiple_files: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/categories")
async def get_categories():
    """Get available processing categories"""
    return {
        "categories": [
            {
                "id": "technical",
                "name": "Technical Specifications",
                "description": "Engineering specifications and technical details"
            },
            {
                "id": "commercial", 
                "name": "Commercial Information",
                "description": "Pricing, terms, and commercial information"
            },
            {
                "id": "basic",
                "name": "Basic Machine Details", 
                "description": "Basic machine details and applications"
            },
            {
                "id": "all",
                "name": "All Categories",
                "description": "Extract data from all categories"
            }
        ]
    }

@router.get("/health")
async def upload_health_check():
    """Health check for upload service"""
    return {
        "service": "File Upload Service",
        "status": "healthy",
        "endpoints": {
            "upload_files": "POST /uploadfile/",
            "categories": "GET /uploadfile/categories",
            "health": "GET /uploadfile/health"
        },
        "supported_formats": ["pdf"],
        "max_file_size": "10MB",
        "max_files_per_request": "Unlimited"
    } 