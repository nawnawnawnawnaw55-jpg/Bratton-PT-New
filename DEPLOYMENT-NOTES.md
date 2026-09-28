# Staging search exclusion and domain-launch cleanup

Added September 28, 2026.

## Temporary Search Console verification

The homepage contains a commented Google verification meta tag for the
`https://bratton-pt.vercel.app/` URL-prefix property. Use the HTML tag verification
method after deploying. No separate Google verification HTML file is needed.

Keep the tag after verification succeeds. Remove the tag and its adjacent
TEMPORARY comment only when that property's verification is no longer needed
(or another verification method is in place). Verify the live custom-domain
property separately; this staging setup is not a substitute for that verification.

## Host-scoped search exclusion

The first header rule in vercel.json sends `X-Robots-Tag: noindex` for all paths
only when the request hostname is `bratton-pt.vercel.app`. The rule does not
target the custom domain or other Vercel deployment aliases. Audit other public
aliases separately if any are in use.

JSON does not support comments, so this document is the cleanup note for that
rule. Preserve the other security and content-type headers and the redirect.

Keep robots.txt crawlable: Google must fetch pages to see the noindex header.
Do not replace this approach with `Disallow: /`.

**Do not remove the staging noindex rule just because the custom domain launches.**
Keep it while the staging hostname remains publicly accessible. Remove the rule
only after retiring/protecting that deployment, or if deliberately allowing that
hostname to be indexed. On Cloudflare, configure any staging exclusions separately;
do not assume Vercel configuration is applied there.

## After deploying these changes

1. Inspect the deployed homepage source for the verification meta tag.
2. Check the homepage and an interior page:

   ```powershell
   curl.exe -I https://bratton-pt.vercel.app/
   curl.exe -I https://bratton-pt.vercel.app/about/
   ```

   Both should return `X-Robots-Tag: noindex`.
3. In Search Console, select the Vercel URL-prefix property and verify using
   HTML tag. Submit the temporary removal for all URLs with the prefix
   `https://bratton-pt.vercel.app/`, not the live-domain property.
4. Temporary removal is not a substitute for the deployed noindex rule.

## Before the custom-domain launch

- Audit and replace staging canonical URLs with the correct absolute live URLs.
  Check old-to-new path mappings instead of assuming every path is unchanged.
- Update staging references in sitemap.xml, robots.txt, social metadata, and any
  other generated metadata. These URLs were not changed by this exclusion fix.
- Configure permanent redirects for changed live-site paths.
- Check the actual custom-domain responses for a successful status and no
  unintended noindex header or robots meta tag on indexable pages. Check any
  hosting/CDN rules too, not just this repository.
- Keep the Vercel staging exclusion if that site is still public.