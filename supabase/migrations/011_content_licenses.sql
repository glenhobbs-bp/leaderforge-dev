-- Migration: 011_content_licenses
-- Description: Create content licensing tables (Phase 3 - Marketplace)
-- Date: 2024-12-14
-- Note: Tables created for future use, not actively used in MVP

-- Content licenses: Tenant-to-tenant content licensing
CREATE TABLE content.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  
  -- Parties
  licensor_tenant_id UUID NOT NULL REFERENCES core.tenants(id),  -- Owner
  licensee_tenant_id UUID NOT NULL REFERENCES core.tenants(id),  -- Buyer
  
  -- License terms
  license_type TEXT NOT NULL DEFAULT 'perpetual'
    CHECK (license_type IN ('perpetual', 'subscription')),
  price_paid_cents INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate active licenses
  UNIQUE (content_id, licensee_tenant_id)
);

CREATE INDEX idx_licenses_content ON content.licenses(content_id);
CREATE INDEX idx_licenses_licensor ON content.licenses(licensor_tenant_id);
CREATE INDEX idx_licenses_licensee ON content.licenses(licensee_tenant_id);
CREATE INDEX idx_licenses_active ON content.licenses(status) WHERE status = 'active';

COMMENT ON TABLE content.licenses IS 'Content licensing between tenants (Phase 3)';

-- Marketplace listings: Content available for licensing
CREATE TABLE content.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  seller_tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  
  -- Listing details (can differ from content metadata)
  title TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  pricing_model TEXT NOT NULL DEFAULT 'free'
    CHECK (pricing_model IN ('free', 'one_time', 'subscription')),
  price_cents INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (content_id)  -- One listing per content item
);

CREATE INDEX idx_listings_seller ON content.marketplace_listings(seller_tenant_id);
CREATE INDEX idx_listings_active ON content.marketplace_listings(is_active) WHERE is_active = true;
CREATE INDEX idx_listings_featured ON content.marketplace_listings(featured) WHERE featured = true;

COMMENT ON TABLE content.marketplace_listings IS 'Content marketplace listings (Phase 3)';

-- Grant permissions
GRANT SELECT ON content.licenses TO authenticated;
GRANT SELECT ON content.marketplace_listings TO authenticated;
GRANT ALL ON content.licenses TO service_role;
GRANT ALL ON content.marketplace_listings TO service_role;

