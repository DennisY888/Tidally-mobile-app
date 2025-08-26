#!/usr/bin/env python3
"""
Comprehensive SVG Analysis Script
Extracts detailed visual and structural properties from SVG files for LLM understanding
"""

import os
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
import colorsys
from datetime import datetime
import webcolors
from urllib.parse import urlparse
import math

class SVGAnalyzer:
    def __init__(self):
        self.namespaces = {
            'svg': 'http://www.w3.org/2000/svg',
            'xlink': 'http://www.w3.org/1999/xlink'
        }
        
    def get_basic_properties(self, svg_path):
        """Extract basic SVG properties"""
        try:
            file_stats = {
                "file_path": svg_path,
                "file_name": os.path.basename(svg_path),
                "file_size_bytes": os.path.getsize(svg_path),
                "file_size_kb": round(os.path.getsize(svg_path) / 1024, 2)
            }
            
            tree = ET.parse(svg_path)
            root = tree.getroot()
            
            # Remove namespace prefix for easier processing
            self._strip_namespace(root)
            
            # Get SVG dimensions
            width = root.get('width', '100%')
            height = root.get('height', '100%')
            viewbox = root.get('viewBox', '')
            
            # Parse viewBox if dimensions are in percentages
            viewbox_dims = None
            if viewbox:
                try:
                    vb_parts = viewbox.split()
                    if len(vb_parts) == 4:
                        viewbox_dims = {
                            "x": float(vb_parts[0]),
                            "y": float(vb_parts[1]),
                            "width": float(vb_parts[2]),
                            "height": float(vb_parts[3])
                        }
                except ValueError:
                    pass
            
            # Parse numeric dimensions
            def parse_dimension(dim):
                if isinstance(dim, str):
                    # Remove units and extract number
                    number_match = re.match(r'([0-9.]+)', dim.replace('px', '').replace('pt', '').replace('em', ''))
                    return float(number_match.group(1)) if number_match else None
                return dim
            
            width_num = parse_dimension(width)
            height_num = parse_dimension(height)
            
            # Use viewBox dimensions if regular dimensions aren't available
            if not width_num and viewbox_dims:
                width_num = viewbox_dims['width']
            if not height_num and viewbox_dims:
                height_num = viewbox_dims['height']
            
            aspect_ratio = None
            if width_num and height_num:
                aspect_ratio = round(width_num / height_num, 2)
            
            return {
                **file_stats,
                "svg_version": root.get('version', 'Not specified'),
                "dimensions": {
                    "width": width,
                    "height": height,
                    "width_numeric": width_num,
                    "height_numeric": height_num,
                    "aspect_ratio": aspect_ratio,
                    "viewbox": viewbox_dims
                },
                "has_title": bool(root.find('.//title')),
                "has_description": bool(root.find('.//desc')),
                "title": root.find('.//title').text if root.find('.//title') is not None else None,
                "description": root.find('.//desc').text if root.find('.//desc') is not None else None
            }
            
        except Exception as e:
            return {"error": f"Failed to get basic properties: {str(e)}"}
    
    def _strip_namespace(self, elem):
        """Remove namespace prefixes from elements for easier processing"""
        if '}' in elem.tag:
            elem.tag = elem.tag.split('}')[1]
        for child in elem:
            self._strip_namespace(child)
    
    def analyze_elements_and_structure(self, svg_path):
        """Analyze SVG elements and document structure"""
        try:
            tree = ET.parse(svg_path)
            root = tree.getroot()
            self._strip_namespace(root)
            
            elements_count = defaultdict(int)
            elements_details = []
            groups = 0
            layers = 0
            
            def analyze_element(elem, depth=0):
                nonlocal groups, layers
                
                tag = elem.tag.lower()
                elements_count[tag] += 1
                
                if tag == 'g':
                    groups += 1
                    # Check if it's a layer (has id or specific attributes)
                    if elem.get('id') or elem.get('inkscape:label'):
                        layers += 1
                
                # Get element details
                element_info = {
                    "tag": tag,
                    "depth": depth,
                    "attributes": dict(elem.attrib),
                    "has_children": len(list(elem)) > 0
                }
                
                # Extract geometric properties for shape elements
                if tag in ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']:
                    element_info["geometry"] = self._extract_geometry(elem, tag)
                elif tag == 'path':
                    element_info["path_analysis"] = self._analyze_path(elem.get('d', ''))
                elif tag == 'text':
                    element_info["text_content"] = ''.join(elem.itertext()).strip()
                
                elements_details.append(element_info)
                
                # Recursively analyze children
                for child in elem:
                    analyze_element(child, depth + 1)
            
            # Analyze all elements
            for child in root:
                analyze_element(child)
            
            # Categorize SVG type based on content
            svg_type = self._categorize_svg_type(elements_count)
            
            return {
                "total_elements": sum(elements_count.values()),
                "element_counts": dict(elements_count),
                "groups": groups,
                "layers": layers,
                "max_nesting_depth": max([e["depth"] for e in elements_details] + [0]),
                "svg_type": svg_type,
                "has_animations": any(tag in ['animate', 'animateTransform', 'animateMotion'] 
                                    for tag in elements_count.keys()),
                "has_interactivity": any(tag in ['script'] for tag in elements_count.keys()) or 
                                   any('onclick' in str(e.get('attributes', {})) for e in elements_details),
                "structure_complexity": self._assess_complexity(elements_count, groups, layers),
                "elements_details": elements_details[:20]  # Limit for readability
            }
            
        except Exception as e:
            return {"error": f"Failed to analyze elements: {str(e)}"}
    
    def _extract_geometry(self, elem, tag):
        """Extract geometric properties from shape elements"""
        geometry = {}
        
        if tag == 'rect':
            geometry = {
                "x": float(elem.get('x', 0)),
                "y": float(elem.get('y', 0)),
                "width": float(elem.get('width', 0)),
                "height": float(elem.get('height', 0)),
                "rx": float(elem.get('rx', 0)),
                "ry": float(elem.get('ry', 0))
            }
        elif tag == 'circle':
            geometry = {
                "cx": float(elem.get('cx', 0)),
                "cy": float(elem.get('cy', 0)),
                "r": float(elem.get('r', 0))
            }
        elif tag == 'ellipse':
            geometry = {
                "cx": float(elem.get('cx', 0)),
                "cy": float(elem.get('cy', 0)),
                "rx": float(elem.get('rx', 0)),
                "ry": float(elem.get('ry', 0))
            }
        elif tag == 'line':
            geometry = {
                "x1": float(elem.get('x1', 0)),
                "y1": float(elem.get('y1', 0)),
                "x2": float(elem.get('x2', 0)),
                "y2": float(elem.get('y2', 0))
            }
        
        return geometry
    
    def _analyze_path(self, path_data):
        """Analyze SVG path data"""
        if not path_data:
            return {"commands": [], "complexity": "none"}
        
        # Extract path commands
        commands = re.findall(r'[MmLlHhVvCcSsQqTtAaZz]', path_data)
        command_counts = Counter(commands)
        
        # Assess path complexity
        complexity = "low"
        if len(commands) > 50:
            complexity = "high"
        elif len(commands) > 15:
            complexity = "medium"
        
        # Determine path type
        path_type = "line"
        if any(cmd in commands for cmd in ['C', 'c', 'S', 's', 'Q', 'q', 'T', 't']):
            path_type = "curve"
        elif 'A' in commands or 'a' in commands:
            path_type = "arc"
        
        return {
            "total_commands": len(commands),
            "command_counts": dict(command_counts),
            "complexity": complexity,
            "type": path_type,
            "is_closed": 'Z' in commands or 'z' in commands
        }
    
    def _categorize_svg_type(self, elements_count):
        """Categorize SVG based on its content"""
        if elements_count.get('path', 0) > elements_count.get('rect', 0) + elements_count.get('circle', 0):
            if elements_count.get('text', 0) > 0:
                return "illustration_with_text"
            return "illustration_or_drawing"
        elif elements_count.get('rect', 0) > 5 or elements_count.get('circle', 0) > 5:
            return "diagram_or_chart"
        elif elements_count.get('text', 0) > 3:
            return "text_heavy"
        elif sum(elements_count.values()) < 5:
            return "simple_graphic"
        else:
            return "complex_graphic"
    
    def _assess_complexity(self, elements_count, groups, layers):
        """Assess overall structural complexity"""
        total_elements = sum(elements_count.values())
        
        if total_elements > 100 or groups > 20 or layers > 10:
            return "high"
        elif total_elements > 25 or groups > 5 or layers > 3:
            return "medium"
        else:
            return "low"
    
    def analyze_colors_and_styling(self, svg_path):
        """Analyze colors, gradients, and styling"""
        try:
            tree = ET.parse(svg_path)
            root = tree.getroot()
            self._strip_namespace(root)
            
            colors = []
            gradients = []
            patterns = []
            styles = defaultdict(int)
            
            def extract_colors_from_element(elem):
                # Check various color attributes
                color_attrs = ['fill', 'stroke', 'stop-color', 'color']
                for attr in color_attrs:
                    value = elem.get(attr)
                    if value and value != 'none':
                        colors.append({
                            "value": value,
                            "attribute": attr,
                            "element": elem.tag
                        })
                
                # Parse style attribute
                style = elem.get('style', '')
                if style:
                    style_parts = [s.strip() for s in style.split(';') if s.strip()]
                    for part in style_parts:
                        if ':' in part:
                            prop, val = part.split(':', 1)
                            prop, val = prop.strip(), val.strip()
                            styles[prop] += 1
                            
                            if prop in ['fill', 'stroke', 'stop-color'] and val != 'none':
                                colors.append({
                                    "value": val,
                                    "attribute": prop,
                                    "element": elem.tag
                                })
                
                # Check for gradients and patterns
                if elem.tag in ['linearGradient', 'radialGradient']:
                    gradient_info = {
                        "type": elem.tag,
                        "id": elem.get('id'),
                        "stops": len(elem.findall('.//stop'))
                    }
                    gradients.append(gradient_info)
                elif elem.tag == 'pattern':
                    patterns.append({
                        "id": elem.get('id'),
                        "width": elem.get('width'),
                        "height": elem.get('height')
                    })
            
            # Analyze all elements
            for elem in root.iter():
                extract_colors_from_element(elem)
            
            # Process and analyze colors
            processed_colors = self._process_colors(colors)
            
            return {
                "total_colors": len(set(c["value"] for c in colors)),
                "color_usage": processed_colors,
                "gradients": gradients,
                "patterns": patterns,
                "styling_properties": dict(styles),
                "has_gradients": len(gradients) > 0,
                "has_patterns": len(patterns) > 0,
                "color_complexity": "high" if len(set(c["value"] for c in colors)) > 10 else 
                                  "medium" if len(set(c["value"] for c in colors)) > 3 else "low"
            }
            
        except Exception as e:
            return {"error": f"Failed to analyze colors: {str(e)}"}
    
    def _process_colors(self, colors):
        """Process and categorize colors"""
        color_counts = Counter(c["value"] for c in colors)
        processed = []
        
        for color_value, count in color_counts.most_common():
            color_info = {
                "value": color_value,
                "usage_count": count,
                "type": self._get_color_type(color_value)
            }
            
            # Try to convert to RGB and get color name
            rgb = self._parse_color_to_rgb(color_value)
            if rgb:
                color_info["rgb"] = rgb
                color_info["hex"] = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
                
                # Get color name
                try:
                    color_info["name"] = webcolors.rgb_to_name(rgb)
                except ValueError:
                    # Find closest color
                    color_info["name"] = self._get_closest_color_name(rgb)
                
                # Get HSV values
                hsv = colorsys.rgb_to_hsv(rgb[0]/255, rgb[1]/255, rgb[2]/255)
                color_info["hsv"] = {
                    "hue": round(hsv[0] * 360, 1),
                    "saturation": round(hsv[1] * 100, 1),
                    "value": round(hsv[2] * 100, 1)
                }
            
            processed.append(color_info)
        
        return processed
    
    def _get_color_type(self, color_value):
        """Determine the type of color specification"""
        if color_value.startswith('#'):
            return "hex"
        elif color_value.startswith('rgb'):
            return "rgb"
        elif color_value.startswith('hsl'):
            return "hsl"
        elif color_value.startswith('url'):
            return "reference"
        else:
            return "named"
    
    def _parse_color_to_rgb(self, color_value):
        """Parse various color formats to RGB"""
        try:
            if color_value.startswith('#'):
                # Hex color
                hex_val = color_value[1:]
                if len(hex_val) == 3:
                    hex_val = ''.join([c*2 for c in hex_val])
                return tuple(int(hex_val[i:i+2], 16) for i in (0, 2, 4))
            
            elif color_value.startswith('rgb'):
                # RGB color
                numbers = re.findall(r'\d+', color_value)
                if len(numbers) >= 3:
                    return tuple(int(n) for n in numbers[:3])
            
            elif not color_value.startswith('url'):
                # Named color
                try:
                    return webcolors.name_to_rgb(color_value)
                except ValueError:
                    pass
        except:
            pass
        
        return None
    
    def _get_closest_color_name(self, rgb):
        """Find closest named color"""
        min_colors = {}
        for key, name in webcolors.CSS3_HEX_TO_NAMES.items():
            r_c, g_c, b_c = webcolors.hex_to_rgb(key)
            rd = (r_c - rgb[0]) ** 2
            gd = (g_c - rgb[1]) ** 2
            bd = (b_c - rgb[2]) ** 2
            min_colors[(rd + gd + bd)] = name
        return min_colors[min(min_colors.keys())]
    
    def extract_text_content(self, svg_path):
        """Extract all text content from SVG"""
        try:
            tree = ET.parse(svg_path)
            root = tree.getroot()
            self._strip_namespace(root)
            
            text_elements = []
            fonts = set()
            
            for elem in root.iter():
                if elem.tag == 'text' or elem.tag == 'tspan':
                    text_content = ''.join(elem.itertext()).strip()
                    if text_content:
                        text_info = {
                            "content": text_content,
                            "element": elem.tag,
                            "x": elem.get('x', '0'),
                            "y": elem.get('y', '0'),
                            "font_family": elem.get('font-family', ''),
                            "font_size": elem.get('font-size', ''),
                            "font_weight": elem.get('font-weight', ''),
                            "text_anchor": elem.get('text-anchor', ''),
                            "fill": elem.get('fill', '')
                        }
                        
                        # Extract font from style attribute
                        style = elem.get('style', '')
                        if 'font-family' in style:
                            font_match = re.search(r'font-family:\s*([^;]+)', style)
                            if font_match:
                                text_info["font_family"] = font_match.group(1).strip()
                        
                        text_elements.append(text_info)
                        
                        if text_info["font_family"]:
                            fonts.add(text_info["font_family"])
            
            # Combine all text
            all_text = ' '.join([t["content"] for t in text_elements])
            
            return {
                "has_text": len(text_elements) > 0,
                "text_elements_count": len(text_elements),
                "text_elements": text_elements,
                "fonts_used": list(fonts),
                "total_text_length": len(all_text),
                "full_text": all_text,
                "word_count": len(all_text.split()) if all_text else 0
            }
            
        except Exception as e:
            return {"error": f"Failed to extract text: {str(e)}"}
    
    def analyze_composition_and_layout(self, svg_path):
        """Analyze SVG composition and layout"""
        try:
            tree = ET.parse(svg_path)
            root = tree.getroot()
            self._strip_namespace(root)
            
            # Get SVG bounds
            viewbox = root.get('viewBox', '')
            if viewbox:
                vb_parts = [float(x) for x in viewbox.split()]
                bounds = {
                    "x": vb_parts[0],
                    "y": vb_parts[1],
                    "width": vb_parts[2],
                    "height": vb_parts[3]
                }
            else:
                width = float(re.match(r'([0-9.]+)', str(root.get('width', '100'))).group(1))
                height = float(re.match(r'([0-9.]+)', str(root.get('height', '100'))).group(1))
                bounds = {"x": 0, "y": 0, "width": width, "height": height}
            
            # Analyze element distribution
            element_positions = []
            
            def get_element_bounds(elem):
                """Get approximate bounds for different elements"""
                if elem.tag == 'rect':
                    return {
                        "x": float(elem.get('x', 0)),
                        "y": float(elem.get('y', 0)),
                        "width": float(elem.get('width', 0)),
                        "height": float(elem.get('height', 0))
                    }
                elif elem.tag == 'circle':
                    cx, cy, r = float(elem.get('cx', 0)), float(elem.get('cy', 0)), float(elem.get('r', 0))
                    return {"x": cx-r, "y": cy-r, "width": 2*r, "height": 2*r}
                elif elem.tag == 'text':
                    return {
                        "x": float(elem.get('x', 0)),
                        "y": float(elem.get('y', 0)),
                        "width": 0,  # Approximate
                        "height": 0
                    }
                return None
            
            for elem in root.iter():
                if elem.tag in ['rect', 'circle', 'ellipse', 'text', 'path']:
                    bounds_info = get_element_bounds(elem)
                    if bounds_info:
                        element_positions.append({
                            "element": elem.tag,
                            "bounds": bounds_info
                        })
            
            # Analyze distribution
            if element_positions:
                x_positions = [pos["bounds"]["x"] for pos in element_positions]
                y_positions = [pos["bounds"]["y"] for pos in element_positions]
                
                distribution = {
                    "elements_count": len(element_positions),
                    "x_range": {"min": min(x_positions), "max": max(x_positions)},
                    "y_range": {"min": min(y_positions), "max": max(y_positions)},
                    "center_x": sum(x_positions) / len(x_positions),
                    "center_y": sum(y_positions) / len(y_positions)
                }
            else:
                distribution = {"elements_count": 0}
            
            # Determine layout type
            aspect_ratio = bounds["width"] / bounds["height"] if bounds["height"] != 0 else 1
            orientation = "landscape" if aspect_ratio > 1.2 else "portrait" if aspect_ratio < 0.8 else "square"
            
            return {
                "canvas_bounds": bounds,
                "aspect_ratio": round(aspect_ratio, 2),
                "orientation": orientation,
                "element_distribution": distribution,
                "layout_density": "high" if len(element_positions) > 50 else 
                               "medium" if len(element_positions) > 15 else "low"
            }
            
        except Exception as e:
            return {"error": f"Failed to analyze composition: {str(e)}"}
    
    def comprehensive_svg_analysis(self, svg_path):
        """Perform comprehensive SVG analysis"""
        print(f"Analyzing SVG: {svg_path}")
        print("-" * 50)
        
        analysis_results = {
            "analysis_timestamp": datetime.now().isoformat(),
            "basic_properties": self.get_basic_properties(svg_path),
            "elements_and_structure": self.analyze_elements_and_structure(svg_path),
            "colors_and_styling": self.analyze_colors_and_styling(svg_path),
            "text_content": self.extract_text_content(svg_path),
            "composition_and_layout": self.analyze_composition_and_layout(svg_path)
        }
        
        return analysis_results
    
    def format_for_llm(self, analysis_results):
        """Format analysis results for LLM consumption"""
        basic = analysis_results.get("basic_properties", {})
        structure = analysis_results.get("elements_and_structure", {})
        colors = analysis_results.get("colors_and_styling", {})
        text = analysis_results.get("text_content", {})
        composition = analysis_results.get("composition_and_layout", {})
        
        description = f"""
SVG ANALYSIS SUMMARY:

BASIC PROPERTIES:
- File: {basic.get('file_name', 'Unknown')}
- Dimensions: {basic.get('dimensions', {}).get('width', 'Unknown')} x {basic.get('dimensions', {}).get('height', 'Unknown')}
- Aspect Ratio: {composition.get('aspect_ratio', 'Unknown')} ({composition.get('orientation', 'Unknown')})
- File Size: {basic.get('file_size_kb', 0)} KB
- Has Title: {'Yes' if basic.get('has_title', False) else 'No'}
- Has Description: {'Yes' if basic.get('has_description', False) else 'No'}

CONTENT TYPE & STRUCTURE:
- SVG Type: {structure.get('svg_type', 'Unknown').replace('_', ' ').title()}
- Total Elements: {structure.get('total_elements', 0)}
- Groups/Layers: {structure.get('groups', 0)} groups, {structure.get('layers', 0)} layers
- Structure Complexity: {structure.get('structure_complexity', 'Unknown')}
- Max Nesting Depth: {structure.get('max_nesting_depth', 0)}
- Has Animations: {'Yes' if structure.get('has_animations', False) else 'No'}
- Has Interactivity: {'Yes' if structure.get('has_interactivity', False) else 'No'}

VISUAL CHARACTERISTICS:"""
        
        # Element breakdown
        if structure.get('element_counts'):
            description += "\n- Element Types: "
            elements = []
            for elem_type, count in structure['element_counts'].items():
                if count > 0:
                    elements.append(f"{count} {elem_type}{'s' if count > 1 else ''}")
            description += ", ".join(elements[:5])  # Top 5 element types
        
        description += f"""

COLOR ANALYSIS:
- Total Colors: {colors.get('total_colors', 0)}
- Color Complexity: {colors.get('color_complexity', 'Unknown')}
- Has Gradients: {'Yes' if colors.get('has_gradients', False) else 'No'}
- Has Patterns: {'Yes' if colors.get('has_patterns', False) else 'No'}"""
        
        # Top colors
        if colors.get('color_usage'):
            description += "\n- Dominant Colors: "
            top_colors = []
            for color in colors['color_usage'][:3]:  # Top 3 colors
                name = color.get('name', color.get('value', 'Unknown'))
                usage = color.get('usage_count', 0)
                top_colors.append(f"{name} ({usage} uses)")
            description += ", ".join(top_colors)
        
        description += f"""

TEXT CONTENT:
- Contains Text: {'Yes' if text.get('has_text', False) else 'No'}
- Text Elements: {text.get('text_elements_count', 0)}
- Total Words: {text.get('word_count', 0)}
- Fonts Used: {len(text.get('fonts_used', []))}"""
        
        if text.get('full_text'):
            preview_text = text['full_text'][:200]
            if len(text['full_text']) > 200:
                preview_text += "..."
            description += f"\n- Text Preview: \"{preview_text}\""
        
        description += f"""

LAYOUT & COMPOSITION:
- Canvas Size: {composition.get('canvas_bounds', {}).get('width', 'Unknown')} x {composition.get('canvas_bounds', {}).get('height', 'Unknown')}
- Layout Density: {composition.get('layout_density', 'Unknown')}
- Elements Distribution: {composition.get('element_distribution', {}).get('elements_count', 0)} positioned elements

TECHNICAL DETAILS:
- SVG Version: {basic.get('svg_version', 'Not specified')}
- ViewBox Defined: {'Yes' if basic.get('dimensions', {}).get('viewbox') else 'No'}"""
        
        return description.strip()

# Example usage
if __name__ == "__main__":
    # Placeholder SVG path - replace with actual SVG file
    svg_path = "bluefolder.svg"  # Replace with your SVG file
    
    analyzer = SVGAnalyzer()
    
    try:
        # Perform comprehensive analysis
        results = analyzer.comprehensive_svg_analysis(svg_path)
        
        # Save detailed results to JSON
        with open("svg_analysis_detailed.json", "w") as f:
            json.dump(results, f, indent=2)
        
        # Generate LLM-friendly summary
        llm_description = analyzer.format_for_llm(results)
        
        # Save LLM description
        with open("svg_analysis_summary.txt", "w") as f:
            f.write(llm_description)
        
        print("COMPREHENSIVE SVG ANALYSIS COMPLETE")
        print("=" * 50)
        print(llm_description)
        print("\nDetailed results saved to: svg_analysis_detailed.json")
        print("LLM summary saved to: svg_analysis_summary.txt")
        
    except FileNotFoundError:
        print(f"Error: SVG file '{svg_path}' not found.")
        print("Please update the 'svg_path' variable with a valid SVG file path.")
    except Exception as e:
        print(f"Error analyzing SVG: {str(e)}")