import re

# Job type patterns
JOB_TYPE_PATTERNS = {
    "internship": re.compile(
        r"(?:internship|harjoittelu|trainee|temporary|kesätyö|project|projekti)",
        re.IGNORECASE | re.UNICODE,
    ),
    "part_time": re.compile(
        r"(?:part[- ]?time|shift[- ]?work|osa[- ]?aikainen|osa[- ]?aika"
        r"|tuntityö|keikkatyö)",
        re.IGNORECASE | re.UNICODE,
    ),
    "full_time": re.compile(
        r"(?:full[- ]?time|kokoaikainen|kokoaika)",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Language patterns (English/Finnish)
LANGUAGE_PATTERNS = {
    "required": re.compile(
        r"(?:(?:english|englanti)|(?:finnish|suomi)|(?:swedish|ruotsi))"
        r"\s+(?:(?:required|vaaditaan|välttämätön|pakollinen)|"
        r"(?:essential|välttämätön)|"
        r"(?:mandatory|pakollinen))",
        re.IGNORECASE | re.UNICODE,
    ),
    "advantage": re.compile(
        r"(?:(?:english|englanti)|(?:(?:finnish|suomi))|(?:(?:swedish|ruotsi)))"
        r"\s+(?:(?:advantage|etu|plussaa)|(?:eduksi)|(?:plus))",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Experience patterns
EXPERIENCE_PATTERNS = {
    "student": re.compile(
        r"(?:student|opiskelija|intern|harjoittelija|trainee|summer\s+job|kesätyö)",
        re.IGNORECASE | re.UNICODE,
    ),
    "entry": re.compile(
        r"(?:entry\s+level|aloittelija|junior|juniori|fresh\s+graduate|"
        r"vastavalmistunut|no\s+experience|ei\s+kokemusta|1-2\s+years?|1-2\s+vuotta?)",
        re.IGNORECASE | re.UNICODE,
    ),
    "junior": re.compile(
        r"(?:specialist|asiantuntija|experienced|kokenut|professional|"
        r"ammattilainen|2-5\s+years?|2-5\s+vuotta?)",
        re.IGNORECASE | re.UNICODE,
    ),
    "senior": re.compile(
        r"(?:senior|vanhempi|lead|johtava|expert|erityisasiantuntija|"
        r"5\+?\s+years?|yli\s+5\s+vuotta?)",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Education patterns
EDUCATION_PATTERNS = {
    "vocational": re.compile(
        r"(?:vocational|ammatti|apprenticeship|oppisopimus|certificate|"
        r"todistus|diploma|diplomi|tutinto|ammatillinen)",
        re.IGNORECASE | re.UNICODE,
    ),
    "bachelor": re.compile(
        r"(?:bachelor'?s?|kandidaatti|bachelor'?s?\s+degree|"
        r"kandidaatin\s+tutkinto|university|university\s+of\s+applied\s+sciences|"
        r"yliopisto|ammattikorkeakoulu|AMK)",
        re.IGNORECASE | re.UNICODE,
    ),
    "master": re.compile(
        r"(?:master'?s?|maisteri|master'?s?\s+degree|"
        r"maisterin\s+tutkinto|MBA|mba|MEng|M\.Eng\.)",
        re.IGNORECASE | re.UNICODE,
    ),
    "phd": re.compile(
        r"(?:phd|ph\.?d\.?|tohtori|doctorate|tohtori\s+tutkinto|"
        r"doctoral|postgraduate)",
        re.IGNORECASE | re.UNICODE,
    ),
}

# Skill patterns
SKILL_PATTERNS = {
    "technical": re.compile(
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
    "domain_specific": re.compile(
        r"\b(?:pipeline|putkilinja|welding|hitsaus|construction|rakentaminen|"
        r"engineering|insinööri|manufacturing|valmistus|"
        r"quality\s+control|laatukontrolli|safety|turvallisuus|"
        r"regulations|säännökset|compliance|yhdysmäärrys|iso|"
        r"iso\s+standardi|"
        r"drawing|piirustus|blueprint|piirros|autocad|autocad|"
        r"solidworks|solidworks|revit|revit|"
        r"sap|sap|erp|erp|crm|crm|salesforce|salesforce|"
        r"banking|pankki|finance|rahoitus|healthcare|terveydenhuolto|"
        r"education|koulutus|government|valtionhallinto|"
        r"e-commerce|verkkokauppa|retail|vähittäiskauppa|"
        r"IT|tietotekniikka|logistics|logistiikka|kuljetus|"
        r"rim|sertifikaatti|tutkinto|pätevyys|kortti|lupa|lisenssi"
        r"|metsäteollisuus|metsä|puu|energia|sähkö|kaasu|lämpö|"
        r"räjestyksenvalvojakortti|vartijakortti|työturvallisuuskortti)\b",
        re.IGNORECASE,
    ),
    "certificate": re.compile(
        r"(?:työturvallisuuskortti|TTT-kortti|turvakortti|"
        r"safe\s+pass|work\s+permit"
        r"hygieniapassi|anniskelupassi|tulityökortti|"
        r"ensiapukortti|tieturvakortti|sähkötyöturvallisuuskortti)",
        re.IGNORECASE | re.UNICODE,
    ),
    "soft_skills": re.compile(
        r"\b(?:communication|kommunikaatio|teamwork|tiimityö|leadership|johtaminen|"
        r"problem\s+solving|ongelmanratkaisu|analytical|analyyttinen|"
        r"critical\s+thinking|kriittinen\s+ajattelu|creativity|luovuus|"
        r"adaptability|joustavuus|flexibility|joustavuus|"
        r"time\s+management|aikaopas|organization|organisaatio|"
        r"attention\s+to\s+detail|huomio\s+tarkkuuteen|customer\s+service|"
        r"asiakaspalvelu|interpersonal|ihmissuhteet|collaboration|yhteistyö|"
        r"project\s+management|projektinhallinta|agile|agile|"
        r"scrum|scrum|kanban|kanban)\b",
        re.IGNORECASE,
    ),
}

YEARS_PATTERN = re.compile(
    r"(\d+)(?:\+|\s*-\s*\d+)?\s+years?\s+(?:of\s+)?experience", re.IGNORECASE
)
