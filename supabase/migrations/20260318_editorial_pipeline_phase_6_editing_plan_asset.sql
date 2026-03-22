begin;

alter table public.manuscript_assets
  drop constraint if exists manuscript_assets_asset_kind_check;

alter table public.manuscript_assets
  add constraint manuscript_assets_asset_kind_check check (
    asset_kind in (
      'manuscript',
      'normalized_text',
      'analysis_output',
      'editing_plan',
      'edited_manuscript',
      'proofread_manuscript',
      'metadata_asset',
      'cover_asset',
      'layout_asset',
      'package_asset'
    )
  );

commit;
