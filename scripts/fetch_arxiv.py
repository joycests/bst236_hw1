#!/usr/bin/env python3
"""
Fetch papers from arXiv API and save to JSON file.
"""

import json
import sys
import feedparser
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode

# API endpoint
ARXIV_API_URL = "http://export.arxiv.org/api/query?"

def fetch_arxiv_papers(query, max_results=100):
    """
    Fetch papers from arXiv API.
    
    Args:
        query: Search query for arXiv
        max_results: Maximum number of results to fetch
        
    Returns:
        List of paper dictionaries with title, authors, abstract, pdf
    """
    params = {
        'search_query': query,
        'start': 0,
        'max_results': max_results,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending'
    }
    
    url = ARXIV_API_URL + urlencode(params)
    print(f"Fetching from: {url}")
    
    # Parse the feed
    feed = feedparser.parse(url)
    
    if feed.get('bobo_exception'):
        print(f"Error: {feed['bobo_exception']}")
        return []
    
    papers = []
    for entry in feed.get('entries', []):
        # Extract arXiv ID from the id field (format: http://arxiv.org/abs/XXXX.XXXXX)
        arxiv_id = entry.get('id', '').split('/abs/')[-1]
        
        paper = {
            'title': entry.get('title', '').strip(),
            'authors': [author.get('name', '') for author in entry.get('authors', [])],
            'abstract': entry.get('summary', '').strip(),
            'pdf': None,
            'pdf_url': None,
            'abs_url': f'https://arxiv.org/abs/{arxiv_id}',
            'published': entry.get('published', '').split('T')[0]  # YYYY-MM-DD
        }
        
        # Extract PDF URL from links
        for link in entry.get('links', []):
            if link.get('type') == 'application/pdf':
                paper['pdf'] = link.get('href', '')
                paper['pdf_url'] = link.get('href', '')
                break
        
        papers.append(paper)
    
    return papers

def save_papers_json(papers, query, output_file):
    """
    Save papers to JSON file.
    
    Args:
        papers: List of paper dictionaries
        query: The search query used
        output_file: Path to output JSON file
    """
    data = {
        'query': query,
        'updated_at': datetime.now().isoformat(),
        'papers': papers
    }
    
    # Ensure parent directory exists
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved {len(papers)} papers to {output_file}")

def main():
    """Main entry point."""
    # Default search query
    query = "machine learning"
    
    # Allow query to be passed as command line argument
    if len(sys.argv) > 1:
        query = sys.argv[1]
    
    # Fetch papers
    papers = fetch_arxiv_papers(query, max_results=100)
    
    # Determine output file path (relative to this script)
    script_dir = Path(__file__).parent
    output_file = script_dir.parent / 'arxiv' / 'papers.json'
    
    # Save to JSON
    save_papers_json(papers, query, output_file)

if __name__ == '__main__':
    main()
