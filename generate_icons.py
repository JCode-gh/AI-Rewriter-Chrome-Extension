from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Define colors
    center_x, center_y = size // 2, size // 2
    radius = int(size * 0.45)
    
    # Draw gradient-like circle background (simulate gradient with multiple circles)
    for i in range(radius, 0, -1):
        # Create color gradient from purple to blue
        ratio = i / radius
        r = int(102 + (118 - 102) * ratio)  # 667eea to 764ba2
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        alpha = int(255 * (1.1 - ratio * 0.3))  # Slight transparency towards edges
        
        draw.ellipse([center_x - i, center_y - i, center_x + i, center_y + i], 
                    fill=(r, g, b, alpha))
    
    # Add inner highlight
    highlight_radius = int(radius * 0.7)
    for i in range(highlight_radius, 0, -1):
        ratio = i / highlight_radius
        alpha = int(80 * ratio)  # White highlight with transparency
        draw.ellipse([center_x - i, center_y - i, center_x + i, center_y + i], 
                    fill=(255, 255, 255, alpha))
    
    # Add text
    try:
        if size >= 32:
            # For larger icons, use "AI" text
            font_size = int(size * 0.3)
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                try:
                    font = ImageFont.truetype("Arial.ttf", font_size)
                except:
                    font = ImageFont.load_default()
            
            # Get text size for centering
            text = "AI"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            text_x = center_x - text_width // 2
            text_y = center_y - text_height // 2
            
            # Draw text shadow
            draw.text((text_x + 1, text_y + 1), text, fill=(0, 0, 0, 100), font=font)
            # Draw main text
            draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
            
            # Add sparkles for larger icons
            if size >= 48:
                # Top sparkle
                sparkle_radius = max(1, int(size * 0.05))
                sparkle_x = center_x + int(size * 0.2)
                sparkle_y = center_y - int(size * 0.2)
                draw.ellipse([sparkle_x - sparkle_radius, sparkle_y - sparkle_radius,
                            sparkle_x + sparkle_radius, sparkle_y + sparkle_radius],
                           fill=(255, 255, 153, 255))
                
                # Bottom sparkle
                sparkle_radius2 = max(1, int(size * 0.03))
                sparkle_x2 = center_x - int(size * 0.15)
                sparkle_y2 = center_y + int(size * 0.25)
                draw.ellipse([sparkle_x2 - sparkle_radius2, sparkle_y2 - sparkle_radius2,
                            sparkle_x2 + sparkle_radius2, sparkle_y2 + sparkle_radius2],
                           fill=(255, 255, 153, 255))
        else:
            # For 16x16, use a simple "A"
            font_size = int(size * 0.5)
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                try:
                    font = ImageFont.truetype("Arial.ttf", font_size)
                except:
                    font = ImageFont.load_default()
            
            text = "A"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            text_x = center_x - text_width // 2
            text_y = center_y - text_height // 2
            
            # Draw text shadow
            draw.text((text_x + 1, text_y + 1), text, fill=(0, 0, 0, 100), font=font)
            # Draw main text
            draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    except Exception as e:
        print(f"Font rendering error for size {size}: {e}")
        # Fallback: draw a simple circle with dot
        dot_radius = max(2, size // 8)
        draw.ellipse([center_x - dot_radius, center_y - dot_radius,
                     center_x + dot_radius, center_y + dot_radius],
                    fill=(255, 255, 255, 255))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    # Create icons directory if it doesn't exist
    icons_dir = "public/icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate all required icon sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        filename = f"{icons_dir}/icon{size}.png"
        create_icon(size, filename)
    
    print("\nAll icons generated successfully!")
    print("Icon files created:")
    for size in sizes:
        print(f"  - public/icons/icon{size}.png")

if __name__ == "__main__":
    main()
