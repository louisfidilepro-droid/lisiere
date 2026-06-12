import { saveCollection, deleteCollection } from "@/app/admin/actions";

export interface CollGroup {
  name: string; slug: string; count: number; covers: string[];
  row: { id: string; description: string | null; cover_url: string | null; sort_order: number } | null;
}

export default function CollectionsManager({ groups }: { groups: CollGroup[] }) {
  if (groups.length === 0)
    return <p style={{ color: "var(--tx-faint)", fontSize: ".88rem" }}>Aucun dossier pour l’instant. Donne une « Collection / Dossier » à un beat pour en créer un.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {groups.map((g) => (
        <form key={g.slug} action={saveCollection} className="cm-row">
          <input type="hidden" name="name" value={g.name} />
          <div className="cm-title"><b>{g.name}</b><span>{g.count} son{g.count > 1 ? "s" : ""}</span></div>
          <label className="cm-f"><span>Pochette du dossier</span>
            <select name="cover_url" defaultValue={g.row?.cover_url ?? ""}>
              <option value="">Auto (1ère pochette)</option>
              {g.covers.map((c, i) => <option key={c} value={c}>Pochette {i + 1}</option>)}
            </select>
          </label>
          <label className="cm-f cm-desc"><span>Description</span>
            <input name="description" defaultValue={g.row?.description ?? ""} placeholder="optionnel" />
          </label>
          <label className="cm-f cm-ord"><span>Ordre</span>
            <input name="sort_order" type="number" defaultValue={g.row?.sort_order ?? 0} />
          </label>
          <button className="a-act" type="submit">Enregistrer</button>
          {g.row && (
            <button className="a-act" formAction={deleteCollection} style={{ borderColor: "rgba(255,138,138,.4)", color: "#ff8a8a" }} name="id" value={g.row.id}>Réinit.</button>
          )}
        </form>
      ))}
    </div>
  );
}
