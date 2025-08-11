#!/usr/bin/env python3
"""
SVG Properties Analyzer
Extracts and displays detailed properties of SVG files for LLM description purposes.
"""

import os
import re
import xml.etree.ElementTree as ET
from collections import defaultdict, Counter
import glob
from pathlib import Path

class SVGAnalyzer:
    def __init__(self):
        self.color_names = {
            '#FF0000': 'red', '#00FF00': 'green', '#0000FF': 'blue',
            '#FFFF00': 'yellow', '#FF00FF': 'magenta', '#00FFFF': 'cyan',
            '#FFA500': 'orange', '#800080': 'purple', '#FFC0CB': 'pink',
            '#A52A2A': 'brown', '#808080': 'gray', '#000000': 'black',
            '#FFFFFF': 'white', '#40E0D0': 'turquoise', '#008080': 'teal',
            '#FFB6C1': 'light pink', '#90EE90': 'light green'
        }
    
    def hex_to_name(self, hex_color):
        """Convert hex color to human-readable name if known."""
        hex_color = hex_color.upper()
        return self.color_names.get(hex_color, hex_color)
    
    def extract_colors(self, element, colors_found):
        """Recursively extract all colors from SVG elements."""
        # Check common color attributes
        color_attrs = ['fill', 'stroke', 'color', 'stop-color']
        
        for attr in color_attrs:
            color = element.get(attr)
            if color and color.lower() not in ['none', 'transparent', 'inherit']:
                colors_found.add(color)
        
        # Check style attribute
        style = element.get('style', '')
        if style:
            # Extract colors from style string
            color_patterns = [
                r'fill:\s*([^;]+)',
                r'stroke:\s*([^;]+)',
                r'color:\s*([^;]+)',
                r'stop-color:\s*([^;]+)'
            ]
            for pattern in color_patterns:
                matches = re.findall(pattern, style, re.IGNORECASE)
                for match in matches:
                    color = match.strip()
                    if color.lower() not in ['none', 'transparent', 'inherit']:
                        colors_found.add(color)
        
        # Recurse through children
        for child in element:
            self.extract_colors(child, colors_found)
    
    def get_element_counts(self, element, counts):
        """Count different types of SVG elements."""
        tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
        counts[tag] += 1
        
        for child in element:
            self.get_element_counts(child, counts)
    
    def extract_text_content(self, element, texts):
        """Extract all text content from SVG."""
        if element.text and element.text.strip():
            texts.append(element.text.strip())
        
        for child in element:
            self.extract_text_content(child, texts)
    
    def get_viewbox_info(self, root):
        """Extract viewBox and dimension information."""
        viewbox = root.get('viewBox', '')
        width = root.get('width', '')
        height = root.get('height', '')
        
        info = {}
        if viewbox:
            try:
                vb_parts = viewbox.split()
                if len(vb_parts) == 4:
                    info['viewBox'] = {
                        'x': vb_parts[0],
                        'y': vb_parts[1], 
                        'width': vb_parts[2],
                        'height': vb_parts[3]
                    }
            except:
                info['viewBox'] = viewbox
        
        if width:
            info['width'] = width
        if height:
            info['height'] = height
            
        return info
    
    def analyze_gradients_and_patterns(self, root):
        """Analyze gradients and patterns in the SVG."""
        defs = root.find('.//{http://www.w3.org/2000/svg}defs') or root.find('.//defs')
        features = []
        
        if defs is not None:
            # Look for gradients
            for grad_type in ['linearGradient', 'radialGradient']:
                gradients = defs.findall(f'.//{grad_type}') or defs.findall(f'.//{{http://www.w3.org/2000/svg}}{grad_type}')
                if gradients:
                    features.append(f"{len(gradients)} {grad_type}(s)")
            
            # Look for patterns
            patterns = defs.findall('.//pattern') or defs.findall('.//{http://www.w3.org/2000/svg}pattern')
            if patterns:
                features.append(f"{len(patterns)} pattern(s)")
        
        return features
    
    def analyze_svg_file(self, filepath):
        """Analyze a single SVG file and return its properties."""
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()
            
            # Initialize collections
            colors_found = set()
            element_counts = defaultdict(int)
            text_content = []
            
            # Extract information
            self.extract_colors(root, colors_found)
            self.get_element_counts(root, element_counts)
            self.extract_text_content(root, text_content)
            
            # Get dimensions and viewBox
            dimensions = self.get_viewbox_info(root)
            
            # Analyze special features
            special_features = self.analyze_gradients_and_patterns(root)
            
            # Process colors for better readability
            processed_colors = []
            for color in sorted(colors_found):
                if color.startswith('#') and len(color) == 7:
                    processed_colors.append(f"{color} ({self.hex_to_name(color)})")
                else:
                    processed_colors.append(color)
            
            return {
                'filename': os.path.basename(filepath),
                'colors': processed_colors,
                'elements': dict(element_counts),
                'text_content': text_content,
                'dimensions': dimensions,
                'special_features': special_features,
                'total_elements': sum(element_counts.values())
            }
            
        except Exception as e:
            return {
                'filename': os.path.basename(filepath),
                'error': str(e)
            }
    
    def format_analysis(self, analysis):
        """Format analysis results for readable output."""
        if 'error' in analysis:
            return f"❌ {analysis['filename']}: Error - {analysis['error']}\n"
        
        output = []
        output.append(f"🎨 {analysis['filename']}")
        output.append("=" * (len(analysis['filename']) + 3))
        
        # Colors
        if analysis['colors']:
            output.append("🎨 Colors:")
            for color in analysis['colors']:
                output.append(f"   • {color}")
        else:
            output.append("🎨 Colors: None specified (likely uses current color)")
        
        # Dimensions
        if analysis['dimensions']:
            output.append("\n📐 Dimensions:")
            for key, value in analysis['dimensions'].items():
                if isinstance(value, dict):
                    output.append(f"   • {key}: {value}")
                else:
                    output.append(f"   • {key}: {value}")
        
        # Elements
        if analysis['elements']:
            output.append("\n🔧 Elements:")
            sorted_elements = sorted(analysis['elements'].items(), key=lambda x: x[1], reverse=True)
            for element, count in sorted_elements:
                output.append(f"   • {count}x {element}")
            output.append(f"   Total elements: {analysis['total_elements']}")
        
        # Text content
        if analysis['text_content']:
            output.append("\n📝 Text Content:")
            for text in analysis['text_content']:
                output.append(f"   • \"{text}\"")
        
        # Special features
        if analysis['special_features']:
            output.append("\n✨ Special Features:")
            for feature in analysis['special_features']:
                output.append(f"   • {feature}")
        
        # Inferred description
        output.append("\n🤖 LLM Description:")
        description = self.generate_description(analysis)
        output.append(f"   {description}")
        
        output.append("\n" + "-" * 60 + "\n")
        return "\n".join(output)
    
    def generate_description(self, analysis):
        """Generate a human-readable description for LLMs."""
        filename = analysis['filename'].replace('.svg', '')
        parts = []
        
        # Extract animal/object from filename
        name_parts = filename.split('_') if '_' in filename else [filename]
        if len(name_parts) >= 2:
            color_hint = name_parts[0]
            object_name = name_parts[1]
            parts.append(f"A {color_hint} {object_name} icon")
        else:
            parts.append(f"An icon representing {filename}")
        
        # Add color information
        if analysis['colors']:
            color_list = [color.split(' (')[0] for color in analysis['colors']]
            if len(color_list) == 1:
                parts.append(f"colored {color_list[0]}")
            elif len(color_list) <= 3:
                parts.append(f"using colors: {', '.join(color_list)}")
            else:
                parts.append(f"with {len(color_list)} different colors")
        
        # Add complexity information
        total_elements = analysis['total_elements']
        if total_elements <= 5:
            parts.append("with simple geometry")
        elif total_elements <= 15:
            parts.append("with moderate detail")
        else:
            parts.append("with complex geometry")
        
        # Add shape information
        elements = analysis['elements']
        if 'circle' in elements:
            parts.append("featuring circular shapes")
        if 'path' in elements and elements['path'] > 3:
            parts.append("with custom drawn paths")
        if 'rect' in elements:
            parts.append("including rectangular elements")
        
        return ". ".join(parts) + "."

def main():
    """Main function to analyze all SVG files in current directory."""
    analyzer = SVGAnalyzer()
    
    # Find all SVG files in current directory
    svg_files = glob.glob("*.svg")
    
    if not svg_files:
        print("❌ No SVG files found in current directory.")
        return
    
    print(f"🔍 Found {len(svg_files)} SVG files. Analyzing...\n")
    
    # Analyze each file
    for svg_file in sorted(svg_files):
        analysis = analyzer.analyze_svg_file(svg_file)
        formatted_output = analyzer.format_analysis(analysis)
        print(formatted_output)
    
    print(f"✅ Analysis complete! Processed {len(svg_files)} SVG files.")

if __name__ == "__main__":
    main()