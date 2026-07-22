// =============================================================================
// Automation Readiness Analyzer
// =============================================================================

import type {
  AutomationAnalysis,
  AutomationGap,
  AutomationRecommendation,
  ConversionAnalysis,
} from "@/lib/audit/types";

/**
 * Analyze automation readiness based on conversion signals.
 */
export function analyzeAutomation(
  conversion: ConversionAnalysis
): AutomationAnalysis {
  const gaps: AutomationGap[] = [
    {
      key: "whatsapp",
      label: "WhatsApp lead channel",
      present: conversion.has_whatsapp_link,
      weight: 15,
    },
    {
      key: "chat_widget",
      label: "Live chat or chatbot widget",
      present: conversion.has_chat_widget,
      weight: 15,
    },
    {
      key: "lead_form",
      label: "Lead capture form",
      present: conversion.has_form,
      weight: 15,
    },
    {
      key: "booking",
      label: "Online booking or scheduling",
      present: conversion.has_booking_link,
      weight: 12,
    },
    {
      key: "email_capture",
      label: "Email capture or newsletter",
      present: conversion.has_email_link && conversion.has_form,
      weight: 10,
    },
    {
      key: "follow_up",
      label: "Visible follow-up or nurture path",
      present: conversion.has_chat_widget || conversion.has_booking_link,
      weight: 10,
    },
    {
      key: "crm_hints",
      label: "CRM or marketing tool integration",
      present: false, // Hard to detect from HTML alone
      weight: 10,
    },
    {
      key: "automation_evidence",
      label: "Automation or workflow evidence",
      present: conversion.has_chat_widget && conversion.has_booking_link,
      weight: 13,
    },
  ];

  // Score = 100 - sum of missing gap weights
  const missingWeight = gaps
    .filter((g) => !g.present)
    .reduce((sum, g) => sum + g.weight, 0);
  const readinessScore = Math.max(0, Math.min(100, 100 - missingWeight));

  return {
    gaps,
    readiness_score: readinessScore,
  };
}

/**
 * Generate contextual automation recommendations based on gaps.
 */
export function generateAutomationRecommendations(
  analysis: AutomationAnalysis
): AutomationRecommendation[] {
  const recommendations: AutomationRecommendation[] = [];
  const missingGaps = analysis.gaps.filter((g) => !g.present);

  for (const gap of missingGaps) {
    switch (gap.key) {
      case "whatsapp":
        recommendations.push({
          title: "WhatsApp AI Lead Agent",
          description:
            "Add a WhatsApp click-to-chat button on your website and connect it to an AI-powered qualification bot. Visitors can ask questions, get instant replies, and be routed to the right team member automatically.",
          business_impact:
            "Mobile visitors are 3x more likely to engage via WhatsApp than fill a form. Automated qualification ensures no lead waits for a response.",
          effort: "easy",
          category: "automation",
        });
        break;

      case "chat_widget":
        recommendations.push({
          title: "AI Website Assistant",
          description:
            "Deploy an AI-powered chatbot trained on your business content. It can answer common questions, capture visitor details, and hand off to a human when needed.",
          business_impact:
            "Visitors who engage with a chat widget convert at 2.8x the rate of those who do not. An AI assistant works 24/7 without adding headcount.",
          effort: "moderate",
          category: "automation",
        });
        break;

      case "lead_form":
        recommendations.push({
          title: "Lead Capture and Follow-Up Automation",
          description:
            "Add a lead capture form with automated email or WhatsApp follow-up sequences. Every form submission can trigger an instant acknowledgement and a nurture workflow.",
          business_impact:
            "Businesses that follow up within 5 minutes are 10x more likely to close a lead. Automation makes this instant and consistent.",
          effort: "easy",
          category: "automation",
        });
        break;

      case "booking":
        recommendations.push({
          title: "Automated Booking and Reminders",
          description:
            "Add an online scheduling link (Calendly, Cal.com, etc.) with automated confirmation and reminder messages via email or WhatsApp.",
          business_impact:
            "Self-service booking reduces no-shows by 30% and eliminates back-and-forth scheduling messages.",
          effort: "easy",
          category: "automation",
        });
        break;

      case "email_capture":
        recommendations.push({
          title: "Email Capture and Nurture Workflow",
          description:
            "Add an email capture mechanism (newsletter signup, lead magnet download) connected to an automated drip campaign.",
          business_impact:
            "Capturing emails lets you nurture cold visitors into warm leads over time without manual outreach.",
          effort: "moderate",
          category: "automation",
        });
        break;

      case "crm_hints":
        recommendations.push({
          title: "CRM / Google Sheets Lead Routing",
          description:
            "Connect your website forms, chat, and WhatsApp to a CRM or Google Sheets using n8n or Zapier. Every lead gets logged, tagged, and assigned automatically.",
          business_impact:
            "Centralized lead management prevents lost opportunities and gives your team full visibility into the sales pipeline.",
          effort: "moderate",
          category: "automation",
        });
        break;

      case "follow_up":
        recommendations.push({
          title: "Customer Support Knowledge Bot",
          description:
            "Build a knowledge base chatbot that answers FAQs, troubleshoots common issues, and escalates complex queries to your team.",
          business_impact:
            "Reduces support ticket volume by up to 40% and improves customer satisfaction with instant answers.",
          effort: "moderate",
          category: "automation",
        });
        break;

      case "automation_evidence":
        recommendations.push({
          title: "n8n Workflow Automation",
          description:
            "Use n8n to connect your website, CRM, messaging, and internal tools into automated workflows. From lead capture to invoice generation, every repetitive process can be automated.",
          business_impact:
            "End-to-end automation eliminates manual data entry, reduces errors, and lets your team focus on high-value work.",
          effort: "advanced",
          category: "automation",
        });
        break;
    }
  }

  return recommendations;
}
