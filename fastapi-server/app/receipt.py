import io
import pandas as pd
import json
from PIL import Image

def parse_image(gemini_model, image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes))
        prompt = '''
        Agent Role: receipt_parser  
        Tool Usage: Exclusively use the Gemini Multimodal API (vision + text) to process each receipt image.

        Overall Goal: To generate a normalized, machine-readable JSON representation of *every* data element present on one or more provided receipt images. The agent will iteratively invoke Gemini, inspect the returned JSON for completeness/correctness, and refine the prompt until all fields are captured accurately.

        Inputs (from calling agent/environment):

        •⁠  ⁠provided_receipt_images: (list of base64 strings or public URLs, mandatory) The receipt(s) to be parsed. The receipt_parser agent must not prompt the user for additional images.
        •⁠  ⁠target_confidence: (float, optional, default: 0.95) The required confidence threshold (0–1) for critical numeric fields (e.g., total, tax, item prices). If Gemini’s confidence for any such field falls below this value, the agent must re-prompt to clarify.
        •⁠  ⁠max_iterations: (integer, optional, default: 3) Maximum number of Gemini calls allowed per receipt before flagging the receipt as “needs manual review”.

        Mandatory Process – Data Extraction:

        1.⁠ ⁠Iterative Parsing  
          a. Initial call: Supply the image and the JSON schema below.  
          b. Validation: Inspect the returned JSON.  
            - If any *required* field is missing or null → re-prompt with explicit instructions to locate it.  
            - If any numeric field’s confidence is < target_confidence → ask Gemini to zoom/crop the relevant region and re-extract.  
          c. Repeat up to max_iterations.

        2.⁠ ⁠Information Focus Areas (ensure 100 % coverage)  
          - Retailer details: name, address.  
          - Transaction meta: date, time.  
          - Line items: full product/service names, quantity, unit price, total.  
          - Tender & totals: subtotal, tax breakdown by rate, total paid.

        3.⁠ ⁠Data Quality  
          - Normalize all dates to ISO-8601 (YYYY-MM-DD).

        4. Category Assignment
          - For each "item_name", always analyze and fill the "category" according to the product type, using your own best judgment and knowledge. Do not omit this field.   

        Mandatory Process – Synthesis & Validation:

        •⁠  ⁠Source Exclusivity: Base every output solely on the Gemini responses for the provided image(s). Do not hallucinate missing data.  
        •⁠  ⁠Consistency Checks:  
          – Ensure Σ(line-item extended prices) + taxes ≈ total (within ±0.02).  
          – Reject negative or zero quantities/prices unless explicitly marked as “void”.  
          – Cross-check payment amounts sum to total paid.  
        •⁠  ⁠Output Format Compliance: Produce strictly valid JSON conforming to the schema below.

        Expected Final Output (Structured JSON):

        {
          "store_name": "Lucky Karyana Store",
          "store_address": "Model Town, Ludhiana",
          "date": "27-10-2023",
          "time": "15:20:22",
          "items": [
            {
              "item_name": "Potato",
              "category": "groceries,
              "quantity": 1,
              "price": 10.00,
              "total": 10.00
            }
          ],
          "subtotal": 117.00,
          "taxes": [
            {
              "tax_name": "GST",
              "percent": 8.375,
              "amount": 20.00,
            }
          ],
          "total": 137.00
        }
        '''
        response = gemini_model.generate_content([prompt, image])

        extracted_data = None
        if response.text:
            json_start = response.text.find("```json")
            json_end = response.text.rfind("```")

            if json_start != -1 and json_end != -1 and json_end > json_start:
                json_string = response.text[json_start + len("```json"):json_end].strip()
                try:
                    extracted_data = json.loads(json_string)
                    print("JSON loaded successfully.")
                except json.JSONDecodeError as e:
                    print(f"JSON decoding error: {e}")
                    print("String that caused the error:")
                    print(json_string)
            else:
                print("Could not find JSON block within ```json and ``` markers.")
        else:
            print("Received empty response from Gemini API. Data not saved.")
        return extracted_data
    except Exception as e:
        print(f"An error occurred: {e}")
        return None