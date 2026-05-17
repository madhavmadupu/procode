# Pricing Strategy

## Pricing Philosophy

ProCode follows a **generous free tier + premium team/enterprise** model. The individual developer experience is fully featured and free — monetization comes from team collaboration and enterprise features.

## Pricing Tiers

### Individual — Free Forever
**Target:** Individual developers, open-source contributors, students

**Includes:**
- Full IDE (editor, Git, terminal, LSP, DAP)
- Local AI via Ollama (all models)
- Knowledge Graph (full features)
- Multi-Agent system (all agents)
- VS Code extension compatibility
- Community support (Discord, GitHub)
- Personal use license

**Rationale:** Free individual tier drives adoption, builds community, creates network effects. Developers who love ProCode will advocate for it at their companies.

---

### Team — $12/user/month (billed annually) or $15/user/month (billed monthly)
**Target:** Engineering teams (5-50 developers)

**Includes everything in Individual, plus:**
- Shared agent memory across team
- Team knowledge graph (aggregate insights)
- Shared agent task templates
- Admin dashboard (usage analytics, seat management)
- Priority support (48-hour response)
- Team billing and invoicing
- Up to 50 seats

**Rationale:** Teams pay for collaboration features that improve productivity across the organization. $12/user/month is competitive with Copilot Business ($19/user/month) while offering more value.

---

### Enterprise — Custom Pricing
**Target:** Large organizations (50+ developers), regulated industries

**Includes everything in Team, plus:**
- SSO/SAML authentication
- Audit logs (all AI interactions, file changes)
- Custom model deployment (on-premise Ollama)
- Dedicated support (24-hour response, SLA)
- Custom deployment options (air-gapped, VPC)
- Policy enforcement (allowed models, data retention)
- Unlimited seats
- Training and onboarding

**Rationale:** Enterprise pricing based on value delivered — productivity gains, security compliance, dedicated support. Typical enterprise deal: $50,000-$200,000/year.

---

### Educational — Free
**Target:** Students, educators, academic institutions

**Includes everything in Team, plus:**
- Classroom management
- Student progress tracking
- Assignment templates
- Free for verified .edu emails

**Rationale:** Build the next generation of ProCode users. Students who learn on ProCode will demand it at their future employers.

## Feature Comparison

| Feature | Individual | Team | Enterprise |
|---------|-----------|------|------------|
| Full IDE | ✓ | ✓ | ✓ |
| Local AI | ✓ | ✓ | ✓ |
| Knowledge Graph | ✓ | ✓ | ✓ |
| Multi-Agent | ✓ | ✓ | ✓ |
| Extensions | ✓ | ✓ | ✓ |
| Shared Agent Memory | ✗ | ✓ | ✓ |
| Team Knowledge Graph | ✗ | ✓ | ✓ |
| Admin Dashboard | ✗ | ✓ | ✓ |
| SSO/SAML | ✗ | ✗ | ✓ |
| Audit Logs | ✗ | ✗ | ✓ |
| Custom Model Deployment | ✗ | ✗ | ✓ |
| Dedicated Support | ✗ | Priority | 24/7 SLA |
| Seats | 1 | Up to 50 | Unlimited |
| **Price** | **Free** | **$12/user/mo** | **Custom** |

## Revenue Projections

### Year 1 (Launch)
- Individual users: 100,000 (free)
- Team customers: 50 teams × 10 seats avg = 500 seats
- Enterprise customers: 5 deals
- **ARR:** $72,000 (teams) + $250,000 (enterprise) = **$322,000**

### Year 2 (Growth)
- Individual users: 500,000 (free)
- Team customers: 200 teams × 15 seats avg = 3,000 seats
- Enterprise customers: 20 deals
- **ARR:** $432,000 (teams) + $1,000,000 (enterprise) = **$1,432,000**

### Year 3 (Scale)
- Individual users: 2,000,000 (free)
- Team customers: 500 teams × 20 seats avg = 10,000 seats
- Enterprise customers: 50 deals
- **ARR:** $1,440,000 (teams) + $2,500,000 (enterprise) = **$3,940,000**

## Cost Structure

### Fixed Costs
- Infrastructure (CI/CD, website, docs): $2,000/month
- Legal (incorporation, IP, compliance): $5,000/year
- Marketing (content, events): $3,000/month

### Variable Costs
- Cloud model API (optional, for testing): $500/month
- Code signing certificates: $500/year
- Domain, hosting: $100/month

### Total Monthly Burn
- **Year 1:** ~$10,000/month (lean team, founder-led)
- **Year 2:** ~$30,000/month (small team, 3-5 employees)
- **Year 3:** ~$80,000/month (growing team, 10-15 employees)

## Unit Economics

### Customer Acquisition Cost (CAC)
- Individual: $0 (organic, open-source)
- Team: $200 (content marketing, referrals)
- Enterprise: $5,000 (sales process, demos)

### Lifetime Value (LTV)
- Team: $12 × 10 seats × 24 months avg = $2,880
- Enterprise: $100,000 × 36 months avg = $3,600,000

### LTV:CAC Ratio
- Team: 14.4:1 (excellent)
- Enterprise: 720:1 (exceptional)

## Pricing Experiments

### Future Considerations
- **Usage-based pricing** — charge by AI compute hours (for heavy users)
- **Marketplace revenue share** — 15% cut on paid extensions
- **ProCode Cloud** — optional cloud sync/storage ($5/month)
- **Model marketplace** — curated models with revenue sharing
