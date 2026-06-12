import { saveTier } from "@/app/admin/actions";
import type { LicenseTier } from "@/lib/types";

export default function LicenseEditor({ tiers }: { tiers: LicenseTier[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {tiers.map((t) => (
        <form key={t.id} action={saveTier} className="le-row">
          <input type="hidden" name="id" value={t.id} />
          <div className="le-grid">
            <label className="cm-f"><span>Nom</span><input name="name" defaultValue={t.name} /></label>
            <label className="cm-f"><span>Prix € (vide = sur demande)</span><input name="price" defaultValue={t.price_cents != null ? t.price_cents / 100 : ""} placeholder="sur demande" /></label>
            <label className="cm-f"><span>Fichiers livrés</span><input name="files" defaultValue={t.files} /></label>
            <label className="cm-f cm-ord"><span>Ordre</span><input name="sort_order" type="number" defaultValue={t.sort_order} /></label>
          </div>
          <label className="cm-f"><span>Droits (séparés par « · »)</span><textarea name="rights" defaultValue={t.rights} rows={2} /></label>
          <div className="le-foot">
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem", color: "var(--tx-dim)" }}>
              <input type="checkbox" name="active" defaultChecked={t.active} style={{ width: "auto" }} /> Affichée sur le site
            </label>
            <button className="a-act" type="submit">Enregistrer</button>
          </div>
        </form>
      ))}
    </div>
  );
}
