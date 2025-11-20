import re

# Language patterns (English/Finnish)
LANGUAGE_PATTERNS = {
    "required": re.compile(
        # 1. Language ... Requirement
        r"(?:(english|englanti|englannin|finnish|suomi|suomen(?:\s+kieli)?"
        r"|äidinkieli\s+suomi|swedish|ruotsi|ruotsin)"
        r"(?:\s+(?:ja|and|or|tai)\s+(english|englanti|englannin|finnish"
        r"|suomi|suomen(?:\s+kieli)?|äidinkieli\s+suomi|swedish|ruotsi"
        r"|ruotsin))?"
        r"\s+(?:language\s+|kielen\s+)?(?:skills?\s+|taitoa\s+|osaamista\s+)?"
        r"(?:are|is|on)?\s*"
        r"(?:required|essential|mandatory|fluent|sujuva(?:n|a)?|excellent"
        r"|erinomainen|native|vaaditaan|on\s+välttämätön"
        r"|on\s+pakollinen|taitoa|osaamista))"
        # 2. Requirement ... Language
        r"|(?:(?:required|essential|mandatory|fluent|sujuva(?:n|a)?"
        r"|excellent|erinomainen|native|vaaditaan|on\s+välttämätön"
        r"|on\s+pakollinen)"
        r"\s+(?:spoken\s+and\s+written\s+)?(?:in\s+)?"
        r"(english|englanti|englannin|finnish|suomi|suomen(?:\s+kieli)?"
        r"|äidinkieli\s+suomi|swedish|ruotsi|ruotsin))"
        # 3. Working language ... Language
        r"|(?:(?:working\s+language\s+(?:is|will\s+be)|työkieli\s+(?:on))"
        r"\s+"
        r"(english|englanti|englannin|finnish|suomi|suomen(?:\s+kieli)?"
        r"|äidinkieli\s+suomi|swedish|ruotsi|ruotsin))",
        re.IGNORECASE | re.UNICODE,
    ),
    "advantage": re.compile(
        r"(?:(english|englanti|englannin|finnish|suomi|suomen\s+kieli"
        r"|swedish|ruotsi|ruotsin)"
        r"\s+(?:language\s+)?(?:skills?\s+)?(?:is\s+)?(?:an?\s+)?"
        r"(?:advantage|eduksi|plus|asset|beneficial|"
        r"on\s+etu|on\s+plussaa|on\s+hyväksi|arvostetaan))",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Experience patterns
EXPERIENCE_PATTERNS = {
    "student": re.compile(
        r"(?:student|intern|trainee|summer\s+job|thesis|no\s+experience|"
        r"opiskelija|harjoittelija|harjoittelu|kesätyö|lopputyö"
        r"|ei\s+kokemusta)",
        re.IGNORECASE | re.UNICODE,
    ),
    "entry": re.compile(
        r"(?:entry\s+level|junior|beginner|fresh\s+graduate|recent\s+graduate|"
        r"1-2\s+years|juniori|aloittelija|vastavalmistunut|uransa\s+alussa|"
        r"1-2\s+vuotta)",
        re.IGNORECASE | re.UNICODE,
    ),
    "specialist": re.compile(
        r"(?:specialist|experienced|professional|2-5\s+years|3-5\s+years|"
        r"asiantuntija|osaaja|ammattilainen|kokemusta|kokenut|2-5\s+vuotta)",
        re.IGNORECASE | re.UNICODE,
    ),
    "senior": re.compile(
        r"(?:senior|lead|principal|expert|advanced|5\+?\s+years|7\+?\s+years|"
        r"vanhempi|johtava|erityisasiantuntija|yli\s+5\s+vuotta)",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Education patterns
EDUCATION_PATTERNS = {
    "bachelor": re.compile(
        r"(?:bachelor'?s?|b\.?s\.?|b\.?sc\.?|bachelor\s+degree|"
        r"bachelor\s+of\s+(?:science|arts|engineering|business|"
        r"commerce|technology)|"
        r"university\s+degree|kandidaatti|yliopisto)"
        r"(?:opisto|ammattikorkeakoulu|AMK|"
        r"tietojenkäsittelyn\s+ammattikorkeakoulu)",
        re.IGNORECASE | re.UNICODE,
    ),
    "master": re.compile(
        r"(?:master'?s?|m\.?s\.?|m\.?sc\.?|master\s+degree|"
        r"master\s+of\s+(?:science|arts|engineering|business|"
        r"commerce|technology)|"
        r"mba|m\.?eng\.?|m\.?tech\.?|maisteri)",
        re.IGNORECASE | re.UNICODE,
    ),
    "phd": re.compile(
        r"(?:ph\.?d\.?|doctorate|doctoral|postgraduate|"
        r"post-graduate|advanced\s+degree|tohtori|lisensiaatti)",
        re.IGNORECASE | re.UNICODE,
    ),
    "vocational": re.compile(
        r"(?:vocational|trade\s+school|apprenticeship|"
        r"certificate|diploma|certification|licensed|qualified|"
        r"ammattitutkinto|ammatillinen\s+tutkinto|oppisopimus|ammatti)",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Skill patterns
SKILL_PATTERNS = {
    "programming": re.compile(
        r"(?:\b(?:python|javascript|java|php|ruby|go|golang"
        r"|rust|swift|kotlin|scala|perl|r|matlab|"
        r"sql|nosql|mongodb|postgresql|mysql|oracle|sqlite|redis"
        r"|cassandra|elasticsearch|docker|kubernetes|"
        r"aws|azure|gcp|terraform|ansible|jenkins|git|github|gitlab|"
        r"bitbucket|linux|windows|macos|bash|powershell|"
        r"html|css|react|angular|vue|node\.js|express|django|flask"
        r"|spring|hibernate|tensorflow|pytorch|"
        r"pandas|numpy|scikit-learn|machine\s+learning|ai|"
        r"artificial\s+intelligence|data\s+science|"
        r"big\s+data|hadoop|spark|kafka|airflow)\b"
        r"|c\+\+(?!\w)|c#(?!\w)|(?<!\w)\.net(?!\w))",
        re.IGNORECASE,
    ),
    "soft_skills": re.compile(
        r"\b(?:communication|teamwork|leadership|problem\s+solving|"
        r"analytical|"
        r"critical\s+thinking|creativity|adaptability|flexibility|"
        r"time\s+management|"
        r"organization|attention\s+to\s+detail|customer\s+service|"
        r"interpersonal|"
        r"collaboration|project\s+management|agile|scrum|kanban)\b",
        re.IGNORECASE,
    ),
    "domain_specific": re.compile(
        r"\b(?:pipeline|welding|construction|engineering|manufacturing|"
        r"quality\s+control|safety|regulations|compliance|iso|"
        r"certification|"
        r"drawing|blueprint|autocad|solidworks|revit|sap|erp|crm|"
        r"salesforce|netsuite|infor|wms|datalake|idm|mec|"
        r"oracle|e-commerce|retail|banking|finance|healthcare|insurance|"
        r"education|government|non-profit|"
        r"metsäteollisuus|metsä|puu|sellu|kartonki|energia|voima|"
        r"tuuli|aurinko|sähkö|kaasu|lämpö|rakentaminen|talous|"
        r"finanssi|bank|vakuutus|terveydenhuolto|koulutus|opetus|"
        r"julkishallinto|valtio|kunta|kaupunki|logistics|logistiikka|"
        r"kuljetus|varastointi|it|ohjelmointi|tietotekniikka|"
        r"digitaalinen|digital|rest\s+api|soap|xml)\b"
        r"|(?:CE\s+merkintä|ISO\s+9001|ISO\s+45001|"
        r"OHSAS|laatu|ympäristö|"
        r"sertifikaatti|tutkinto|pätevyys|kortti|lupa|lisenssi)"
        r"(?:työturvallisuuskortti|TTT-kortti|turvakortti)",
        re.IGNORECASE | re.UNICODE,
    ),
    "certificate": re.compile(
        r"(?:työturvallisuuskortti|TTT-kortti|turvakortti|"
        r"hygieniapassi|anniskelupassi|tulityökortti|"
        r"ensiapukortti|tieturvakortti|sähkötyöturvallisuuskortti"
        r"järjestyksenvalvojakortti|vartijakortti)",
        re.IGNORECASE | re.UNICODE,
    ),
}

YEARS_PATTERN = re.compile(
    r"(\d+)(?:\+|\s*-\s*\d+)?\s+years?\s+(?:of\s+)?experience", re.IGNORECASE
)

JOB_TYPE_PATTERNS = {
    "full_time": re.compile(
        r"(?:full[- ]?time|kokoaikainen|kokoaika|päivätyö|37,5\s*h|37.5\s*h)",
        re.IGNORECASE | re.UNICODE,
    ),
    "part_time": re.compile(
        r"(?:part[- ]?time|osa-aikainen|osa-aika|shift[- ]?work|"
        r"vuorotyö|hourly|tuntityö|keikkatyö)",
        re.IGNORECASE | re.UNICODE,
    ),
    "internship": re.compile(
        r"(?:fixed[- ]?term|määräaikainen|määräaika|project|"
        r"projekti|summer[- ]?job|kesätyö|internship|harjoittelu|"
        r"trainee|sijaisuus|substitute|temporary)",
        re.IGNORECASE | re.UNICODE,
    ),
}
