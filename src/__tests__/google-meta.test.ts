import { describe, it, expect } from "vitest";
import { analyzeGoogleMeta, maskTrackingId } from "@/lib/audit/google-meta-analyzer";

describe("maskTrackingId", () => {
  it("masks GA4 tracking IDs correctly", () => {
    expect(maskTrackingId("G-1234567890")).toBe("G-****7890");
    expect(maskTrackingId("G-ABCDEF1234")).toBe("G-****1234");
  });

  it("masks GTM container IDs correctly", () => {
    expect(maskTrackingId("GTM-ABC1234")).toBe("GTM-****1234");
  });

  it("masks Google Ads IDs correctly", () => {
    expect(maskTrackingId("AW-987654321")).toBe("AW-****4321");
  });

  it("masks numeric Meta Pixel IDs showing only last 4 digits", () => {
    expect(maskTrackingId("123456789012345")).toBe("****2345");
  });

  it("returns null for null inputs", () => {
    expect(maskTrackingId(null)).toBeNull();
  });
});

describe("analyzeGoogleMeta", () => {
  it("detects GA4, GTM, Google Ads, and masks identifiers", async () => {
    const html = `
      <html>
        <head>
          <script src="https://www.googletagmanager.com/gtag/js?id=G-1234567890"></script>
          <script>gtag('config', 'G-1234567890');</script>
          <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});})(window,document,'script','dataLayer','GTM-ABC1234');</script>
          <script>gtag('config', 'AW-987654321');</script>
          <meta name="google-site-verification" content="verification_token_123" />
        </head>
        <body>
          <a href="https://privacy.example.com">Privacy Policy</a>
          <a href="https://terms.example.com">Terms of Service</a>
        </body>
      </html>
    `;

    const result = await analyzeGoogleMeta(html, "https://example.com");

    expect(result.googleVisibility.ga4_detected).toBe(true);
    expect(result.googleVisibility.ga4_id_masked).toBe("G-****7890");

    expect(result.googleVisibility.gtm_detected).toBe(true);
    expect(result.googleVisibility.gtm_id_masked).toBe("GTM-****1234");

    expect(result.googleVisibility.google_ads_detected).toBe(true);
    expect(result.googleVisibility.google_ads_id_masked).toBe("AW-****4321");

    expect(result.googleVisibility.search_console_verified).toBe(true);
    expect(result.googleVisibility.has_privacy_policy).toBe(true);
    expect(result.googleVisibility.has_terms_of_service).toBe(true);
  });

  it("detects Meta Pixel code and masks Pixel ID", async () => {
    const html = `
      <html>
        <head>
          <script>
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '987654321098765');
            fbq('track', 'PageView');
          </script>
          <meta name="facebook-domain-verification" content="meta_verification_123" />
        </head>
        <body>
          <a href="https://facebook.com/example">Facebook Page</a>
          <a href="https://instagram.com/example">Instagram Profile</a>
          <a href="https://wa.me/1234567890">WhatsApp Us</a>
        </body>
      </html>
    `;

    const result = await analyzeGoogleMeta(html, "https://example.com");

    expect(result.metaMarketing.pixel_detected).toBe(true);
    expect(result.metaMarketing.pixel_id_masked).toBe("****8765");
    expect(result.metaMarketing.domain_verified).toBe(true);
    expect(result.metaMarketing.facebook_page_link).toBe(true);
    expect(result.metaMarketing.instagram_profile_link).toBe(true);
    expect(result.metaMarketing.whatsapp_link).toBe(true);
    // Never falsely claim active CAPI without server connection
    expect(result.metaMarketing.capi_status).toBe("Requires account connection to verify");
  });

  it("parses LocalBusiness JSON-LD schema, maps links, and checks NAP consistency", async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Acme Services Pvt Ltd",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "123 Business Park",
              "addressLocality": "Mumbai",
              "addressRegion": "MH",
              "postalCode": "400001",
              "addressCountry": "IN"
            },
            "telephone": "+91-9876543210",
            "openingHours": "Mo-Fr 09:00-18:00",
            "sameAs": ["https://facebook.com/acme", "https://linkedin.com/company/acme"]
          }
          </script>
        </head>
        <body>
          <a href="https://g.page/acmeservices">Google Business Profile</a>
          <a href="tel:+919876543210">Call +91 98765 43210</a>
          <a href="/contact">Contact Us</a>
          <footer>
            <p>Acme Services Pvt Ltd - 123 Business Park, Mumbai, MH 400001</p>
          </footer>
        </body>
      </html>
    `;

    const result = await analyzeGoogleMeta(html, "https://example.com");

    expect(result.gbpAndLocal.gbp_link_present).toBe(true);
    expect(result.gbpAndLocal.local_business_schema_complete).toBe(true);
    expect(result.gbpAndLocal.business_name).toBe("Acme Services Pvt Ltd");
    expect(result.gbpAndLocal.business_address).toContain("123 Business Park");
    expect(result.gbpAndLocal.phone_present).toBe(true);
    expect(result.gbpAndLocal.click_to_call_present).toBe(true);
    expect(result.gbpAndLocal.opening_hours_present).toBe(true);
    expect(result.gbpAndLocal.same_as_links).toHaveLength(2);
    expect(result.gbpAndLocal.nap_consistency.consistent).toBe(true);
  });

  it("extracts Open Graph and Twitter card tags correctly", async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Acme Services - Best Business Automation" />
          <meta property="og:description" content="Transform your business with AI and workflow automation." />
          <meta property="og:image" content="https://example.com/og.jpg" />
          <meta property="og:url" content="https://example.com" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Acme Services Twitter Title" />
          <meta name="twitter:description" content="Twitter description text" />
          <meta name="twitter:image" content="https://example.com/twitter.jpg" />
        </head>
        <body></body>
      </html>
    `;

    const result = await analyzeGoogleMeta(html, "https://example.com");

    expect(result.socialSharing.og_title).toBe("Acme Services - Best Business Automation");
    expect(result.socialSharing.og_description).toBe("Transform your business with AI and workflow automation.");
    expect(result.socialSharing.og_image).toBe("https://example.com/og.jpg");
    expect(result.socialSharing.og_url).toBe("https://example.com");
    expect(result.socialSharing.og_type).toBe("website");
    expect(result.socialSharing.twitter_card).toBe("summary_large_image");
    expect(result.socialSharing.twitter_title).toBe("Acme Services Twitter Title");
  });
});
