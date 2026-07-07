# DEPRECATED: This module has been moved to backend.utils.reporter
from backend.utils.reporter import ReportGenerator, generate_pdf_report
import warnings
warnings.warn("backend.services.reporter is deprecated. Use backend.utils.reporter instead.", DeprecationWarning)
