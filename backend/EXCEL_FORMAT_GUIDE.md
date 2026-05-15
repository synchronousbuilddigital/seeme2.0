# SeeMee Catalog Import - Excel Format Reference

## Quick Sample

Here's what your Excel file should look like:

```
┌─────────────────────┬──────────────────┬────────┬─────────┬────────────────────────────────┐
│ name                │ category         │ price  │ stock   │ image_url                      │
├─────────────────────┼──────────────────┼────────┼─────────┼────────────────────────────────┤
│ Royal Anarkali      │ anarkali         │ 1500   │ 5       │ https://example.com/royal1.jpg │
│ Velvet Palazzo Set  │ palazzo          │ 2000   │ 8       │ https://example.com/velvet.jpg │
│ Silk Straight Cut   │ straight-cut     │ 1200   │ 12      │ https://example.com/silk1.jpg  │
│ Cotton Lehenga      │ lehenga          │ 1800   │ 3       │ https://example.com/cot123.jpg │
│ Designer Saree      │ saree            │ 3000   │ 6       │ https://example.com/design.jpg │
└─────────────────────┴──────────────────┴────────┴─────────┴────────────────────────────────┘
```

## Full Column Reference

### Required Columns
- **name** — Product name
  - Alternatives: `Name`, `product_name`, `Product Name`
  - Example: `Royal Anarkali`

- **image_url** — Full URL to the product image
  - Alternatives: `imageUrl`, `Image`, `image`, `url`, `URL`
  - Example: `https://example.com/image.jpg`
  - Must start with `http://` or `https://`

### Optional But Recommended
- **category** — Product category
  - Alternatives: `Category`
  - Examples: `anarkali`, `palazzo`, `saree`, `lehenga`, `straight-cut`, `kurti`

- **price** — Selling price
  - Alternatives: `Price`
  - Example: `1500`

- **stock** — Quantity available
  - Alternatives: `Stock`
  - Example: `10`

### Optional (Advanced)
- **mrp** — Maximum retail price
  - Alternatives: `MRP`
  - Used for discount calculations

- **description** — Product description
  - Alternatives: `Description`
  - Long text field

- **sku** — Stock keeping unit (unique identifier)
  - Alternatives: `SKU`
  - If not provided, auto-generated

## Image URL Requirements

Your image URLs should:
- ✅ Be publicly accessible (no auth required)
- ✅ Start with `http://` or `https://`
- ✅ Point to an actual image file (JPG, PNG, WebP, etc.)
- ✅ Work when accessed directly in a browser
- ✅ Be under 5MB in size

Examples of valid URLs:
```
https://example.com/products/dress.jpg
https://cdn.retailer.com/catalog/item-123.png
https://storage.service.com/images/anarkali-2024.webp
```

Examples of INVALID URLs:
```
/images/dress.jpg                    ❌ Relative path
image.jpg                             ❌ Relative path
ftp://server.com/image.jpg           ❌ Not HTTP/HTTPS
https://dropbox.com/s/xxx?dl=0       ❌ Needs ?dl=1 parameter
https://example.com/image            ❌ No file extension
```

## How to Create Your Excel File

### Option 1: Microsoft Excel / Google Sheets
1. Create new spreadsheet
2. Add headers in Row 1: `name`, `category`, `price`, `stock`, `image_url`
3. Add product data starting Row 2
4. Export as `.xlsx` (Microsoft Excel format)
5. Save to: `backend/SeeMee_Catlog.xlsx`

### Option 2: CSV to XLSX Conversion
1. Create CSV file with comma-separated values
2. Open in Excel or Google Sheets
3. Save as `.xlsx`

### Option 3: LibreOffice / Open Office
1. Create spreadsheet
2. Add data
3. File → Save As → Format: "Microsoft Excel 2007-365 (.xlsx)"

## Column Name Variants Supported

The script is **flexible** with column names. These all work:

```
name ≈ Name ≈ product_name ≈ Product Name ≈ PRODUCT ≈ product

category ≈ Category ≈ CATEGORY ≈ product_category

price ≈ Price ≈ PRICE ≈ selling_price ≈ price_inr

image_url ≈ imageUrl ≈ Image ≈ image ≈ url ≈ URL ≈ image_link ≈ product_image

stock ≈ Stock ≈ quantity ≈ Quantity ≈ stock_count ≈ available
```

## Example: Multi-Row Dataset

```
| name              | category   | price | stock | mrp  | image_url                           |
|-------------------|------------|-------|-------|------|-------------------------------------|
| Anarkali Dress 1  | anarkali   | 1500  | 5     | 2000 | https://example.com/anarkali1.jpg   |
| Anarkali Dress 2  | anarkali   | 1200  | 8     | 1800 | https://example.com/anarkali2.jpg   |
| Palazzo Set       | palazzo    | 2000  | 3     | 2800 | https://example.com/palazzo1.jpg    |
| Straight Cut      | straight   | 1000  | 12    | 1400 | https://example.com/straight1.jpg   |
| Lehenga           | lehenga    | 3500  | 2     | 5000 | https://example.com/lehenga1.jpg    |
| Saree             | saree      | 2500  | 6     | 3500 | https://example.com/saree1.jpg      |
```

## Test Before Import

Before running the full import:
1. Add 2-3 test products to your Excel
2. Verify all image URLs work in a browser
3. Run: `npm run import:catalog-images`
4. Check admin panel to see if products were created
5. Verify images display correctly

## Debugging Missing Columns

If the script says "No image URL found", it means:
- Your image column name doesn't match expected names
- Column is empty
- Column value isn't a valid URL

**Solution:** Check your Excel column headers match one of these exactly:
- `image_url`, `imageUrl`, `Image`, `image`, `url`, `URL`

(Case-insensitive, but spelling must match)

## Ready to Import?

1. ✅ Create/prepare your Excel file
2. ✅ Save as `.xlsx` to `backend/SeeMee_Catlog.xlsx`
3. ✅ Run: `npm run import:catalog-images`
4. ✅ Monitor output
5. ✅ Done!

See [CATALOG_IMPORT_GUIDE.md](CATALOG_IMPORT_GUIDE.md) for full instructions.
