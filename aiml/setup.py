"""
Setup script for AIML RAG Service
"""

from setuptools import setup, find_packages
import os
import re

# Read version from config
def get_version():
    with open("app/config.py", "r") as f:
        content = f.read()
        match = re.search(r'APP_VERSION\s*=\s*["\']([^"\']+)["\']', content)
        if match:
            return match.group(1)
    return "1.0.0"

# Read README
def read_readme():
    try:
        with open("README.md", "r", encoding="utf-8") as f:
            return f.read()
    except:
        return "AIML RAG Service with FastAPI, Pinecone, and Mistral AI"

# Read requirements
def read_requirements():
    try:
        with open("requirements.txt", "r") as f:
            return [line.strip() for line in f if line.strip() and not line.startswith("#")]
    except:
        return []

setup(
    name="aiml-rag-service",
    version=get_version(),
    author="AIML Team",
    author_email="team@aiml-service.com",
    description="AIML RAG Service with FastAPI, Pinecone, and Mistral AI",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/aiml-rag-service",
    packages=find_packages(),
    include_package_data=True,
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.11.0",
            "flake8>=6.1.0",
            "mypy>=1.6.0",
            "isort>=5.12.0",
            "pre-commit>=3.3.0",
        ],
        "postgres": [
            "psycopg2-binary>=2.9.9",
            "sqlalchemy>=2.0.23",
        ],
        "redis": [
            "redis>=5.0.0",
        ],
        "monitoring": [
            "prometheus-client>=0.19.0",
            "opentelemetry-api>=1.18.0",
            "opentelemetry-sdk>=1.18.0",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
    entry_points={
        "console_scripts": [
            "aiml-rag=app.main:main",
        ],
    },
    project_urls={
        "Bug Reports": "https://github.com/yourusername/aiml-rag-service/issues",
        "Source": "https://github.com/yourusername/aiml-rag-service",
        "Documentation": "https://github.com/yourusername/aiml-rag-service#readme",
    },
)

# Development commands (can be used with `python setup.py <command>`)
# python setup.py install
# python setup.py develop
# python setup.py test
# python setup.py bdist_wheel