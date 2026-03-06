"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Code2, 
  FileJson, 
  Globe, 
  CheckCircle2, 
  XCircle,
  Zap
} from "lucide-react";

const API_BASE_URL = "https://hub.hebelingimperium.com";

const brandExamples = [
  { name: "iKingdom", slug: "ikingdom", domain: "ikingdom.org" },
  { name: "Editorial Reino", slug: "editorial-reino", domain: "editorialreino.com" },
  { name: "Imperiug", slug: "imperiug", domain: "imperiug.org" },
  { name: "Max Hebeling", slug: "max-hebeling", domain: "maxhebeling.com" },
];

function CodeBlock({ code, language = "javascript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-zinc-400" />
        )}
      </Button>
    </div>
  );
}

export default function ApiDocsPage() {
  const exampleRequest = `{
  "brand_slug": "ikingdom",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 555 123 4567",
  "notes": "Interested in web development services",
  "source": "landing_page",
  "deal_title": "Website Redesign",
  "deal_value": 5000,
  "deal_currency": "USD"
}`;

  const successResponse = `{
  "success": true,
  "data": {
    "tenant_id": "uuid-tenant-id",
    "contact_id": "uuid-contact-id",
    "deal_id": "uuid-deal-id",
    "brand": "iKingdom",
    "source": "landing_page"
  }
}`;

  const errorResponse = `{
  "error": "brand_slug and full_name are required"
}`;

  const fetchExample = (brandSlug: string) => `// Submit lead to ${brandSlug}
async function submitLead(formData) {
  try {
    const response = await fetch('${API_BASE_URL}/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand_slug: '${brandSlug}',
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.message,
        source: 'landing_page'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}`;

  const formExample = `<!-- HTML Form -->
<form id="leadForm" class="contact-form">
  <input type="text" name="name" placeholder="Full Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="tel" name="phone" placeholder="Phone" />
  <textarea name="message" placeholder="Message"></textarea>
  <button type="submit">Send</button>
  <div id="formMessage"></div>
</form>

<script>
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const messageDiv = document.getElementById('formMessage');
  
  // Disable button during submission
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  const formData = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    message: form.message.value.trim(),
  };
  
  // Validate required fields
  if (!formData.name) {
    messageDiv.innerHTML = '<span class="error">Name is required</span>';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send';
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    messageDiv.innerHTML = '<span class="error">Invalid email format</span>';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send';
    return;
  }
  
  try {
    const response = await fetch('${API_BASE_URL}/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_slug: 'ikingdom', // Change to your brand
        full_name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        notes: formData.message || undefined,
        source: 'landing_page'
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Success
      messageDiv.innerHTML = '<span class="success">Thank you! We will contact you soon.</span>';
      form.reset();
    } else {
      // API error
      messageDiv.innerHTML = '<span class="error">' + (data.error || 'Something went wrong') + '</span>';
    }
  } catch (error) {
    // Network error
    messageDiv.innerHTML = '<span class="error">Connection error. Please try again.</span>';
  }
  
  submitBtn.disabled = false;
  submitBtn.textContent = 'Send';
});
</script>

<style>
.contact-form input, .contact-form textarea {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.contact-form button {
  background: #0066cc;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.contact-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
#formMessage .success {
  color: #22c55e;
  font-weight: 500;
}
#formMessage .error {
  color: #ef4444;
  font-weight: 500;
}
</style>`;

  const validationExample = `// Client-side validation before API call
function validateLeadForm(formData) {
  const errors = [];
  
  // Required field: full_name
  if (!formData.name || formData.name.trim() === '') {
    errors.push('Full name is required');
  }
  
  // Email format validation (if provided)
  if (formData.email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Phone format validation (optional)
  if (formData.phone) {
    const phoneRegex = /^[+]?[\\d\\s()-]{7,}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.push('Invalid phone format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Usage
const validation = validateLeadForm(formData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  return;
}
// Proceed with API call...`;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Lead API Documentation
          </h1>
          <p className="text-muted-foreground mt-1">
            Integrate lead capture from your landing pages and external websites.
          </p>
        </div>
      </div>

      {/* Endpoint Overview */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              POST
            </Badge>
            <code className="text-sm bg-muted px-3 py-1.5 rounded-lg font-mono">
              {API_BASE_URL}/api/leads
            </code>
          </div>
          <p className="text-sm text-muted-foreground">
            Submit a new lead to the CRM. Creates a tenant (with lead status), contact, and deal automatically.
          </p>
        </CardContent>
      </Card>

      {/* Request Format */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Request Format
          </CardTitle>
          <CardDescription>JSON body with Content-Type: application/json</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Fields */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Required Fields</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Field</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">brand_slug</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Brand identifier (e.g., "ikingdom", "editorial-reino")</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">full_name</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Lead's full name</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Optional Fields</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Field</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">email</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Email address</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">phone</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Phone number</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">notes</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Additional notes or message</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">source</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Lead source: "landing_page" | "linkedin" | "whatsapp" | "referral" | "manual"</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">deal_title</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Custom deal title (defaults to "Lead: [name]")</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">deal_value</code></td>
                    <td className="py-2 px-3 text-muted-foreground">number</td>
                    <td className="py-2 px-3">Deal value (defaults to 0)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">deal_currency</code></td>
                    <td className="py-2 px-3 text-muted-foreground">string</td>
                    <td className="py-2 px-3">Currency code (defaults to "USD")</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Example Request */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Example Request Body</h4>
            <CodeBlock code={exampleRequest} language="json" />
          </div>
        </CardContent>
      </Card>

      {/* Responses */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h4 className="text-sm font-medium text-foreground">Success Response (200)</h4>
            </div>
            <CodeBlock code={successResponse} language="json" />
          </div>

          {/* Error */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-red-500" />
              <h4 className="text-sm font-medium text-foreground">Error Response (400/404/500)</h4>
            </div>
            <CodeBlock code={errorResponse} language="json" />
            <div className="mt-3 text-sm text-muted-foreground">
              <p><strong>400:</strong> Missing required fields (brand_slug, full_name)</p>
              <p><strong>404:</strong> Brand not found</p>
              <p><strong>500:</strong> Internal server error</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Examples */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Brand Integration Examples
          </CardTitle>
          <CardDescription>Copy the code for your specific brand</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={brandExamples[0].slug}>
            <TabsList className="mb-4">
              {brandExamples.map((brand) => (
                <TabsTrigger key={brand.slug} value={brand.slug} className="text-xs">
                  {brand.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {brandExamples.map((brand) => (
              <TabsContent key={brand.slug} value={brand.slug}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Domain:</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">{brand.domain}</code>
                    <span className="text-muted-foreground">Slug:</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">{brand.slug}</code>
                  </div>
                  <CodeBlock code={fetchExample(brand.slug)} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Complete Form Example */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Complete Form Integration
          </CardTitle>
          <CardDescription>Copy-paste ready code for landing page forms</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={formExample} language="html" />
        </CardContent>
      </Card>

      {/* Validation Examples */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Client-side Validation</CardTitle>
          <CardDescription>Validate form data before submitting to the API</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={validationExample} />
        </CardContent>
      </Card>

      {/* Testing */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Testing the API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can test the API using curl or any HTTP client:
          </p>
          <CodeBlock code={`curl -X POST ${API_BASE_URL}/api/leads \\
  -H "Content-Type: application/json" \\
  -d '{
    "brand_slug": "ikingdom",
    "full_name": "Test Lead",
    "email": "test@example.com",
    "source": "manual"
  }'`} />
        </CardContent>
      </Card>
    </div>
  );
}
