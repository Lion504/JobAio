# Self-Assessment  

- **Member name:** *Kumudu Nallaperuma*  
- **Contribution area:** *I worked on the database schema and implemented functions to automatically delete expired job posts and deduplicate job posts and created originaljob model and Translated job modelin backend*

---

### 1. Functionality
- **Does the code meet the requirements?**

- Does it implement all specified features you were responsible for?  
     Yes

  It implements all required features. The OriginalJob model includes all necessary fields and supports weighted full-text search, while the TranslatedJob model correctly mirrors translatable fields and links back via job_id. Both models use a 14-day TTL for automatic cleanup, and duplicates are prevented through unique indexes on (title, company, location) for OriginalJob and (job_id, translation_lang) for TranslatedJob.

  - Are edge cases handled (e.g., invalid data, duplicates)?  
    Partially yes

    Edge cases are partially handled: duplicates are prevented, TTL handles cleanup, and full-text search works well. However, limited validation—such as missing required fields, lack of array constraints, and no enforcement for URL or date formats—means incomplete or inconsistent data can still be saved.

  - Are there any bugs or unexpected behaviors?  
    Minor issues only

    When performing full-text search on array fields, MongoDB indexes the arrays as space-joined strings, which allows them to be searchable but can sometimes lead to unexpected or less precise scoring results. This behavior isn’t a bug, but it’s important to be aware of it when interpreting search relevance or designing queries that rely on weighted text scoring.


- **Integration**
  - Does your code work correctly with other parts of the application? 
    Yes 

    The code work correctly with other parts of the application. The models follow standard Mongoose patterns, the TranslatedJob model properly references the OriginalJob model through job_id, and the indexing structure supports efficient querying. As long as the rest of the application uses these models as intended (e.g., for creating, linking, and searching job records), they will integrate smoothly and function as expected.

  - Are inputs and outputs managed appropriately?  
    Yes

    Inputs and outputs are handled appropriately, with clear field structures and indexing supporting consistent data storage and retrieval. However, due to minimal schema validation, the application must ensure data is properly validated before insertion.
---

### 2. Code Quality
- **Readability**
  - Is your code easy to understand for other developers?  
    Yes

    The code is easy to understand, as it follows clear structure, consistent formatting, and standard Mongoose patterns.

  - Are variable and function names descriptive and meaningful? 
    Yes

    The variable and field names are descriptive and meaningful, clearly indicating the purpose of each part of the schema. 

- **Reusability**
  - Can your code or parts of it be reused elsewhere in the application? 
    Yes

    The schemas can be reused throughout the application, as they are modular, cleanly defined, and easy to import into any service or controller that needs job or translation data. 

  - Is logic modular and separated from unrelated concerns? 
    Yes

    The logic is modular and limited to schema definitions, keeping it clean and separated from unrelated concerns such as business logic or request handling. 
     

- **Comments and Documentation**
  -  Are there comments explaining complex logic?  
     No

     There are comments included, but they focus mainly on explaining indexes and key behaviors rather than deep or complex logic.

  -  Is there documentation for how to use your code unit?  
     No


---

### 3. Performance
- **Efficiency**
  - Are there any unnecessary operations or performance bottlenecks? 
    No

    There are no obvious unnecessary operations or major performance bottlenecks in the schemas.

  - Is the code optimized for larger datasets or high traffic (if applicable)? 
    Yes

    The code is reasonably optimized for larger datasets, as it includes proper indexing, TTL cleanup, and clear schema structures. 

---

### 4. Overall Assessment
- **Strengths**  
  - Well-structured and readable Mongoose schemas
  - Effective indexing for performance and duplicate prevention
  - TTL cleanup for efficient data lifecycle management
  - Modular design that integrates smoothly with the rest of the application


- **Areas for Improvement**  
  - Add stronger validation rules to prevent incomplete or malformed data
  - Enforce formats for fields like URLs and publish dates
  - Add constraints or custom validation for array fields

- **Action Plan**  
  - Replace the generic _metadata: { type: Object } with a defined sub-schema to enforce structure.
  - Remove or correctly implement the language_override field to avoid confusion or misconfiguration in text search. 

---

### 5. Additional Notes
- The models are solid, but adding more validation, refining index choices, and documenting expected data formats would improve reliability and ensure consistency as the application grows.