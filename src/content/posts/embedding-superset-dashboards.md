---
title: "Embedding Apache Superset Dashboards"
published: 2026-02-09
description: "Learn how to embed your Apache Superset dashboards into your own web page."
author: "Mehmet Salih Yavuz"
tags: ["superset", "apache", "embedding"]
toc: true
---

# Embedding Apache Superset Dashboards

Apache Superset is a powerful open-source data visualization and BI platform. One of the most common requests from teams using Superset in production is:

> “How do I embed Superset dashboards into my own application?”

In this post, we’ll walk through **what embedding in Superset actually means**, the available approaches, and how to implement a **secure embedded dashboard** using Superset’s native embedding feature. We’ll also reference a complete working example you can try yourself.

---

## Why Embed Superset?

Embedding allows you to display Superset dashboards inside your own web application while:

* Keeping a consistent UI/UX
* Avoiding redirecting users to Superset itself
* Controlling authentication and authorization
* Exposing dashboards to non-Superset users

Typical use cases include:

* SaaS products exposing analytics to customers
* Internal tools with embedded reporting
* White-label analytics solutions

---

## Superset Embedding Options (Quick Overview)

There are **three common approaches** people consider:

### 1. Public Dashboards (Not Recommended for Most Cases)

You can mark dashboards as public and embed them in an `<iframe>`.

**Downsides:**

* No access control
* No row-level security
* Not suitable for sensitive data

### 2. Session-based Iframe Embedding

You authenticate users against Superset and embed dashboards via iframe.

**Downsides:**

* Tight coupling to Superset auth
* CSRF and cookie issues
* Hard to scale cleanly

### 3. Native Superset Embedded SDK (Recommended)

Superset provides a **first-class embedded dashboard feature** using:

* Guest tokens (JWT)
* Fine-grained access control
* Secure iframe communication

This post focuses on **option 3**.

---

## How Superset Native Embedding Works

At a high level:

1. **Superset generates a Guest Token**

   * Short-lived JWT
   * Scoped to specific dashboards
   * Optional RLS rules

2. **Your backend requests the token**

   * Uses Superset’s REST API
   * Authenticated as a Superset service account

3. **Your frontend embeds the dashboard**

   * Uses the Superset Embedded SDK
   * Passes the guest token to Superset
   * Renders inside an iframe

This keeps:

* Authentication logic in your backend
* Superset isolated and secure
* The frontend simple and safe

---

## Required Superset Configuration

To enable embedding, you’ll need to configure Superset appropriately:

### Enable Embedded Dashboards

```python
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
}
```

### Configure CORS (Important)

Your frontend domain must be allowed:

```python
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],
    "origins": ["https://your-frontend-domain.com"],
}
```

### Create an Embedded Dashboard

In Superset:

1. Open a dashboard
2. Go to **Settings → Embed**
3. Enable embedding
4. Copy the dashboard ID

---

## Generating Guest Tokens

Guest tokens are generated via Superset’s REST API.

Key points:

* Tokens are short-lived
* You can restrict them to specific dashboards
* You can attach row-level security rules

A typical token payload includes:

* Dashboard IDs
* User metadata
* Optional RLS clauses

This step **must happen on your backend**, never in the browser.

---

## Frontend: Embedding the Dashboard

On the frontend, Superset provides a JavaScript SDK that handles:

* Iframe creation
* Token injection
* Message passing

Once you have a guest token, embedding is straightforward:

* Provide the Superset URL
* Provide the dashboard ID
* Provide the guest token

The dashboard behaves almost exactly like it does inside Superset itself.

---

## Complete Working Example

To make this concrete, I’ve put together a **fully working reference implementation**:

👉 **GitHub repo:**
[https://github.com/msyavuz/superset-embedded-example](https://github.com/msyavuz/superset-embedded-example)

The example includes:

* Backend token generation
* Frontend embedding logic
* Minimal setup to get running quickly
* Clear separation between Superset, backend, and frontend

If you’re evaluating Superset embedding or building a production setup, this repo is a good starting point.

---

## Security Considerations

Before shipping embedded dashboards, keep these in mind:

* **Never expose Superset credentials to the frontend**
* Keep guest tokens short-lived
* Restrict tokens to specific dashboards
* Use RLS if embedding per-user data
* Lock down CORS strictly

Superset’s native embedding model is designed to be secure, but only if used correctly.

---

## Final Thoughts

Apache Superset’s embedded dashboards feature makes it possible to build **first-class analytics experiences** directly into your own applications without compromising on security or flexibility.

If you’re already using Superset as your BI layer, embedding is often the missing piece that turns dashboards into a real product feature.

### Additional Reference Implementations

If you’re looking for more perspectives on Superset embedding, there are a couple of solid open-source demos worth checking out.

In addition to my own example:

👉 [superset-embedded-example](https://github.com/msyavuz/superset-embedded-example)

A minimal, end-to-end reference showing backend guest token generation and frontend embedding with a clean separation of concerns.

There’s also an excellent demo by Michael Molina:

👉 [superset-embedded-demo](https://github.com/michael-s-molina/superset-embedded-demo)


If you’re new to embedding or want to cross-check your implementation against another real-world setup, this repo is a great companion reference.

Happy embedding 🚀
