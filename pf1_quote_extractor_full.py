import re
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class Quote:
    """Data class for representing a quote"""
    text: str
    author: Optional[str] = None
    source: Optional[str] = None
    context: Optional[str] = None
    confidence: float = 1.0
    start_position: Optional[int] = None
    end_position: Optional[int] = None

def extract_quotes_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Extract quotes from the given text using multiple strategies
    
    Args:
        text: The input text to extract quotes from
        
    Returns:
        List of dictionaries containing quote information
    """
    quotes = []
    
    # Strategy 1: Extract quotes with explicit quotation marks
    quotes.extend(extract_quoted_text(text))
    
    # Strategy 2: Extract attributed quotes (e.g., "quote" - Author)
    quotes.extend(extract_attributed_quotes(text))
    
    # Strategy 3: Extract block quotes (indented or separated text)
    quotes.extend(extract_block_quotes(text))
    
    # Strategy 4: Extract dialogue quotes
    quotes.extend(extract_dialogue_quotes(text))
    
    # Remove duplicates and sort by position
    unique_quotes = remove_duplicate_quotes(quotes)
    unique_quotes.sort(key=lambda x: x.start_position or 0)
    
    # Convert to dictionaries for JSON serialization
    return [asdict(quote) for quote in unique_quotes]

def extract_quoted_text(text: str) -> List[Quote]:
    """Extract text within quotation marks"""
    quotes = []
    
    # Pattern for various quote styles
    patterns = [
        r'"([^"]*)"',  # Double quotes
        r"'([^']*)'",  # Single quotes
        r'"([^"]*)"',  # Smart double quotes
        r"'([^']*)'",  # Smart single quotes
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            quote_text = match.group(1).strip()
            if len(quote_text) > 10:  # Minimum length to be considered a meaningful quote
                quote = Quote(
                    text=quote_text,
                    start_position=match.start(),
                    end_position=match.end(),
                    confidence=0.9
                )
                quotes.append(quote)
    
    return quotes

def extract_attributed_quotes(text: str) -> List[Quote]:
    """Extract quotes with attribution patterns"""
    quotes = []
    
    # Patterns for attributed quotes
    patterns = [
        r'"([^"]*)"\s*[-—–]\s*([A-Z][a-zA-Z\s]+)',  # "quote" - Author
        r"'([^']*)'\s*[-—–]\s*([A-Z][a-zA-Z\s]+)",  # 'quote' - Author
        r'"([^"]*)"\s*by\s+([A-Z][a-zA-Z\s]+)',     # "quote" by Author
        r"'([^']*)'\s*by\s+([A-Z][a-zA-Z\s]+)",     # 'quote' by Author
        r'"([^"]*)"\s*,\s*([A-Z][a-zA-Z\s]+)',      # "quote", Author
        r"'([^']*)'\s*,\s*([A-Z][a-zA-Z\s]+)",      # 'quote', Author
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            quote_text = match.group(1).strip()
            author = match.group(2).strip()
            
            if len(quote_text) > 10:
                quote = Quote(
                    text=quote_text,
                    author=author,
                    start_position=match.start(),
                    end_position=match.end(),
                    confidence=0.95
                )
                quotes.append(quote)
    
    return quotes

def extract_block_quotes(text: str) -> List[Quote]:
    """Extract block quotes (indented or separated text)"""
    quotes = []
    
    # Split text into lines
    lines = text.split('\n')
    
    block_quotes = []
    current_block = []
    in_block = False
    
    for i, line in enumerate(lines):
        stripped_line = line.strip()
        
        # Check if line looks like a block quote
        is_quote_line = (
            stripped_line.startswith('>') or  # Markdown blockquote
            (len(stripped_line) > 50 and not stripped_line.endswith('.')) or  # Long line without period
            (len(stripped_line) > 30 and stripped_line.isupper()) or  # All caps (often quotes)
            (stripped_line and not any(char.isdigit() for char in stripped_line[:10]))  # No numbers at start
        )
        
        if is_quote_line and len(stripped_line) > 20:
            if not in_block:
                in_block = True
                current_block = [stripped_line]
            else:
                current_block.append(stripped_line)
        else:
            if in_block and current_block:
                # End of block quote
                quote_text = ' '.join(current_block)
                if len(quote_text) > 30:
                    quote = Quote(
                        text=quote_text,
                        start_position=text.find(current_block[0]),
                        end_position=text.find(current_block[-1]) + len(current_block[-1]),
                        confidence=0.7
                    )
                    quotes.append(quote)
                in_block = False
                current_block = []
    
    # Handle last block if still open
    if in_block and current_block:
        quote_text = ' '.join(current_block)
        if len(quote_text) > 30:
            quote = Quote(
                text=quote_text,
                start_position=text.find(current_block[0]),
                end_position=text.find(current_block[-1]) + len(current_block[-1]),
                confidence=0.7
            )
            quotes.append(quote)
    
    return quotes

def extract_dialogue_quotes(text: str) -> List[Quote]:
    """Extract dialogue-style quotes"""
    quotes = []
    
    # Pattern for dialogue: "Hello," said John. or "Hello," John said.
    dialogue_patterns = [
        r'"([^"]*)"\s+(?:said|replied|answered|asked|shouted|whispered|mumbled)\s+([A-Z][a-zA-Z\s]+)',
        r'"([^"]*)"\s+([A-Z][a-zA-Z\s]+)\s+(?:said|replied|answered|asked|shouted|whispered|mumbled)',
    ]
    
    for pattern in dialogue_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            quote_text = match.group(1).strip()
            speaker = match.group(2).strip()
            
            if len(quote_text) > 5:
                quote = Quote(
                    text=quote_text,
                    author=speaker,
                    start_position=match.start(),
                    end_position=match.end(),
                    confidence=0.85
                )
                quotes.append(quote)
    
    return quotes

def remove_duplicate_quotes(quotes: List[Quote]) -> List[Quote]:
    """Remove duplicate quotes based on text content and position"""
    seen_quotes = set()
    unique_quotes = []
    
    for quote in quotes:
        # Create a key based on text content and position
        quote_key = (quote.text.lower().strip(), quote.start_position)
        
        if quote_key not in seen_quotes:
            seen_quotes.add(quote_key)
            unique_quotes.append(quote)
    
    return unique_quotes

def extract_context(text: str, quote: Quote, context_length: int = 100) -> str:
    """Extract context around a quote"""
    if quote.start_position is None:
        return ""
    
    start = max(0, quote.start_position - context_length)
    end = min(len(text), quote.end_position + context_length if quote.end_position else quote.start_position + context_length)
    
    return text[start:end].strip()

def enhance_quotes_with_context(text: str, quotes: List[Quote]) -> List[Quote]:
    """Add context to quotes"""
    for quote in quotes:
        quote.context = extract_context(text, quote)
    return quotes

# Additional utility functions for advanced quote extraction

def extract_quotes_with_sentiment(text: str) -> List[Dict[str, Any]]:
    """Extract quotes with basic sentiment analysis"""
    quotes = extract_quotes_from_text(text)
    
    # Simple sentiment analysis based on keywords
    positive_words = ['love', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic', 'beautiful']
    negative_words = ['hate', 'terrible', 'awful', 'horrible', 'disgusting', 'terrible', 'bad']
    
    for quote_data in quotes:
        quote_text = quote_data['text'].lower()
        positive_count = sum(1 for word in positive_words if word in quote_text)
        negative_count = sum(1 for word in negative_words if word in quote_text)
        
        if positive_count > negative_count:
            quote_data['sentiment'] = 'positive'
        elif negative_count > positive_count:
            quote_data['sentiment'] = 'negative'
        else:
            quote_data['sentiment'] = 'neutral'
    
    return quotes

def extract_quotes_by_topic(text: str, topic_keywords: List[str]) -> List[Dict[str, Any]]:
    """Extract quotes that contain specific topic keywords"""
    all_quotes = extract_quotes_from_text(text)
    topic_quotes = []
    
    for quote_data in all_quotes:
        quote_text = quote_data['text'].lower()
        if any(keyword.lower() in quote_text for keyword in topic_keywords):
            quote_data['topics'] = [keyword for keyword in topic_keywords if keyword.lower() in quote_text]
            topic_quotes.append(quote_data)
    
    return topic_quotes

# Main function for external use
def process_text_for_quotes(text: str, include_sentiment: bool = False, topic_keywords: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Main function to process text and extract quotes with optional enhancements
    
    Args:
        text: Input text to process
        include_sentiment: Whether to include sentiment analysis
        topic_keywords: List of keywords to filter quotes by topic
        
    Returns:
        Dictionary containing extracted quotes and metadata
    """
    try:
        if topic_keywords:
            quotes = extract_quotes_by_topic(text, topic_keywords)
        else:
            quotes = extract_quotes_from_text(text)
        
        if include_sentiment:
            quotes = extract_quotes_with_sentiment(text)
        
        return {
            "success": True,
            "quotes": quotes,
            "total_quotes": len(quotes),
            "text_length": len(text),
            "processing_options": {
                "sentiment_analysis": include_sentiment,
                "topic_filtering": topic_keywords is not None
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing text: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "quotes": [],
            "total_quotes": 0
        } 