# Property map clusters

The user approved numbered green clusters that expand on tap or zoom, the existing single-property preview, a picker for overlapping coordinates, and counts based on current filters.

Implementation uses Supercluster in JavaScript with the existing Android Google Map. Build the spatial index from filtered listings and query the visible bounds after camera movement. Combine identical coordinates before indexing so these locations remain selectable at every zoom. Use a 56 dp cluster radius and a maximum cluster zoom of 20. Keep the selected pin individually visible while its preview is open.

1. Add a clustering helper and focused regressions for zoom changes, co-located counts, filtered input, and viewport queries.
2. Render themed count markers, animate cluster expansion, and open a virtualized property picker for co-located or maximum-zoom groups. Reuse the existing preview after a picker selection.
3. Verify TypeScript, focused tests, native ARM64 build, and Android 15/API 35 interactions using production listings. Keep production data unchanged and identify synthetic-only coverage explicitly.
