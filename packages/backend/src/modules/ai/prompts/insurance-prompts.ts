export const EXTRACT_INSURANCE_DATA_PROMPT = `
You are an expert insurance document analyzer. Extract the following information from the insurance certificate:

1. Policy Number
2. Insurer/Carrier Name
3. Named Insured (Policy Holder)
4. Policy Type (General Liability, Workers Compensation, Auto Liability, etc.)
5. Coverage Amounts
6. Effective Date
7. Expiration Date
8. Additional Insured (if any)
9. Certificate Holder

Return the data in JSON format with confidence scores (0-1) for each field.

Document text:
{{{text}}}

Respond ONLY with valid JSON in this exact format:
{
  "policyNumber": { "value": "string", "confidence": 0.95 },
  "insurer": { "value": "string", "confidence": 0.95 },
  "namedInsured": { "value": "string", "confidence": 0.95 },
  "policyType": { "value": "string", "confidence": 0.95 },
  "coverageAmount": { "value": "string", "confidence": 0.95 },
  "effectiveDate": { "value": "YYYY-MM-DD", "confidence": 0.95 },
  "expirationDate": { "value": "YYYY-MM-DD", "confidence": 0.95 },
  "additionalInsured": { "value": "string or null", "confidence": 0.95 },
  "certificateHolder": { "value": "string or null", "confidence": 0.95 }
}
`;

export const CLASSIFY_DOCUMENT_PROMPT = `
Classify the following insurance document into one of these categories:
- GENERAL_LIABILITY
- WORKERS_COMPENSATION
- AUTO_LIABILITY
- PROFESSIONAL_LIABILITY
- UMBRELLA
- PROPERTY_INSURANCE
- OTHER

Provide a confidence score (0-1) for your classification.

Document text:
{{{text}}}

Respond ONLY with valid JSON:
{
  "classification": "GENERAL_LIABILITY",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}
`;

export const VALIDATE_COVERAGE_PROMPT = `
Validate if the following insurance certificate meets the minimum requirements:

Requirements:
- General Liability: $1,000,000 per occurrence, $2,000,000 aggregate
- Workers Compensation: Statutory limits
- Auto Liability: $1,000,000 combined single limit

Document text:
{{{text}}}

Respond ONLY with valid JSON:
{
  "isCompliant": true/false,
  "missingCoverage": ["list of missing or insufficient coverages"],
  "recommendations": ["list of recommendations"],
  "confidence": 0.95
}
`;
