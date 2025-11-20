# Sprint 2 -- Language-Based Job Matching & Highlighting

## 1. Overview

- Sprint 2 introduces Language-Based Job Matching, a core feature that identifies whether job listings match a user’s preferred language skills.
- This feature enables the frontend to highlight or flag relevant job opportunities more intelligently.

------------------------------------------------------------------------

## 2. Core Module

### languageMatch.js
### File Location

 - `apps/api/src/utils/languageMatch.js`

 ## 3. Function

 - `const jobLanguages = new Set`-Creates a Set to store all job-related languages while automatically removing duplicates

 - `job.original_job?.job_original_language`- Extracts the original job's language and adds it to the Set if it exists

 - `job.translations`- Iterates through all job translations and adds each translation's language code to the Set

 - `onst matchedLanguages = [...jobLanguages].filter`- Finds which job languages match the user’s languages by computing the intersection of both lists

 - `final return { ...job, isLanguageMatch, matchedLanguages }`- Returns the original job object extended with flags showing whether it matches the user languages and which languages matched.



------------------------------------------------------------------------
## 4. conclusion

- Sprint 2 successfully delivers a cleanly implemented Language-Based Job Matching system.





   



