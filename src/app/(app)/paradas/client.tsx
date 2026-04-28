"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeStopDurationSec, formatDurationSec } from "@/lib/stopCodes";
import type { AppRole } from "@/lib/rbac";

type Line = { id: number; name: string };
type Station = { id: number; name: string };
type Failure = { id: number; stationId: number; label: string };
type OpenWO = { id: string; woNumber: string; productCode: string; smdLineId: number };
type Validator = { id: string; fullName: string; role: AppRole };
type ActiveStop = {
  id: string;
  startedAt: Date;
  smdLine: { name: string };
  station: { name: string };
};
type Stop = {
  id: string;
  smdLineId: number;
  smdLine: { id: number; name: string };
  workOrder: { id: string; woNumber: string; productCode: string } | null;
  station: { id: number; name: string };
  commonFailure: { id: number; label: string } | null;
  customFailure: string | null;
  comment: string | null;
  shift: "MORNING" | "AFTERNOON";
  startedAt: Date;
  endedAt: Date | null;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  reportedBy: { id: string; fullName: string };
  interventionUser: { id: string; fullName: string; role: AppRole } | null;
  interventionRole: AppRole | null;
  validatedBy: { id: string; fullName: string } | null;
  validatedAt: Date | null;
  validatedComment: string | null;
};

const INTERVENTION_ROLES: AppRole[] = ["SUPERVISOR", "MANTENIMIENTO", "PROGRAMACION", "ADMIN"];

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  OPERADOR: "Operador",
  MANTENIMIENTO: "Mantenimiento",
  PROGRAMACION: "Programación",
};

export function ParadasClient({
  role,
  currentUserId,
  myActive,
  stops,
  lines,
  stations,
  failures,
  openWOs,
  validators,
  initialFilters,
}: {
  role: AppRole;
  currentUserId: string;
  myActive: ActiveStop[];
  stops: Stop[];
  lines: Line[];
  stations: Station[];
  failures: Failure[];
  openWOs: OpenWO[];
  validators: Validator[];
  defaultShift: "MORNING" | "AFTERNOON";
  initialFilters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [endingStop, setEndingStop] = useState<{ id: string; label: string } | null>(null);

  function applyFilter(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/paradas?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/paradas");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bgh-700">Paradas de línea</h1>
      </div>

      {myActive.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">
            Tus paradas activas
          </h2>
          {myActive.map((a) => (
            <ActiveCard
              key={a.id}
              stop={a}
              onClickEnd={() =>
                setEndingStop({ id: a.id, label: `${a.smdLine.name} · ${a.station.name}` })
              }
            />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">
          Iniciar nueva parada
        </h2>
        <NewStopForm
          lines={lines}
          stations={stations}
          failures={failures}
          openWOs={openWOs}
          onCreated={() => router.refresh()}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Filtros</h2>
        <Filters
          initial={initialFilters}
          lines={lines}
          stations={stations}
          onApply={applyFilter}
          onClear={clearFilters}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Listado</h2>
        <StopsTable
          stops={stops}
          role={role}
          currentUserId={currentUserId}
          onClickEnd={(s) =>
            setEndingStop({
              id: s.id,
              label: `${s.smdLine.name} · ${s.station.name}`,
            })
          }
          onAction={() => router.refresh()}
        />
      </section>

      {endingStop && (
        <EndStopDialog
          stop={endingStop}
          validators={validators}
          onClose={() => setEndingStop(null)}
          onDone={() => {
            setEndingStop(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ActiveCard({
  stop,
  onClickEnd,
}: {
  stop: ActiveStop;
  onClickEnd: () => void;
}) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 border-l-4 border-bgh-700">
      <div>
        <div className="font-medium text-bgh-700">
          {stop.smdLine.name} · {stop.station.name}
        </div>
        <div className="text-xs text-bgh-400">
          Inició {stop.startedAt.toLocaleString("es-AR")}
        </div>
      </div>
      <button onClick={onClickEnd} className="btn-danger">
        Finalizar parada
      </button>
    </div>
  );
}

function NewStopForm({
  lines,
  stations,
  failures,
  openWOs,
  onCreated,
}: {
  lines: Line[];
  stations: Station[];
  failures: Failure[];
  openWOs: OpenWO[];
  onCreated: () => void;
}) {
  const [smdLineId, setSmdLineId] = useState<number | "">(lines[0]?.id ?? "");
  const [stationId, setStationId] = useState<number | "">(stations[0]?.id ?? "");
  const [commonFailureId, setCommonFailureId] = useState<number | "">("");
  const [customFailure, setCustomFailure] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stationFailures = useMemo(
    () => failures.filter((f) => f.stationId === stationId),
    [failures, stationId]
  );
  const lineOpenWOs = useMemo(
    () => openWOs.filter((w) => w.smdLineId === smdLineId),
    [openWOs, smdLineId]
  );

  function onStationChange(id: number) {
    setStationId(id);
    setCommonFailureId("");
  }

  async function start() {
    setError(null);
    if (!smdLineId || !stationId) {
      setError("Elegí línea y estación.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/line-stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smdLineId,
        stationId,
        commonFailureId: commonFailureId === "" ? null : commonFailureId,
        customFailure: customFailure.trim() || null,
        comment: comment.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Error al iniciar");
      return;
    }
    setCustomFailure("");
    setComment("");
    setCommonFailureId("");
    onCreated();
  }

  return (
    <div className="card space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="label-base">Línea</label>
          <select
            className="input-base"
            value={smdLineId}
            onChange={(e) => setSmdLineId(Number(e.target.value))}
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {lineOpenWOs.length === 1 && (
            <p className="mt-1 text-xs text-bgh-400">
              WO autovinculada: {lineOpenWOs[0].woNumber} · {lineOpenWOs[0].productCode}
            </p>
          )}
          {lineOpenWOs.length > 1 && (
            <p className="mt-1 text-xs text-amber-700">
              {lineOpenWOs.length} WOs abiertas — la parada queda sin WO. Editá luego para asignar.
            </p>
          )}
          {lineOpenWOs.length === 0 && (
            <p className="mt-1 text-xs text-bgh-400">Sin WO abierta para esta línea.</p>
          )}
        </div>
        <div>
          <label className="label-base">Estación</label>
          <select
            className="input-base"
            value={stationId}
            onChange={(e) => onStationChange(Number(e.target.value))}
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="label-base">Falla común</label>
          <select
            className="input-base"
            value={commonFailureId}
            onChange={(e) =>
              setCommonFailureId(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={stationFailures.length === 0}
          >
            <option value="">{stationFailures.length === 0 ? "Sin fallas catalogadas" : "— Elegir —"}</option>
            {stationFailures.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base">Otra falla (texto libre)</label>
          <input
            className="input-base"
            value={customFailure}
            onChange={(e) => setCustomFailure(e.target.value)}
            placeholder="Si no está en el desplegable"
          />
        </div>
      </div>

      <div>
        <label className="label-base">Comentario</label>
        <input
          className="input-base"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={start} disabled={busy} className="btn-primary">
          {busy ? "Iniciando..." : "Iniciar parada"}
        </button>
      </div>
    </div>
  );
}

function EndStopDialog({
  stop,
  validators,
  onClose,
  onDone,
}: {
  stop: { id: string; label: string };
  validators: Validator[];
  onClose: () => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [interventionRole, setInterventionRole] = useState<AppRole>("MANTENIMIENTO");
  const [interventionUserId, setInterventionUserId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(
    () => validators.filter((v) => v.role === interventionRole),
    [validators, interventionRole]
  );

  useEffect(() => {
    setInterventionUserId(filteredUsers[0]?.id ?? "");
  }, [filteredUsers]);

  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);

  async function confirm() {
    setError(null);
    if (!interventionUserId) {
      setError("Elegí un usuario intervinente.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/line-stops/${stop.id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interventionRole, interventionUserId }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Error al finalizar");
      return;
    }
    onDone();
  }

  return (
    <dialog
      ref={ref}
      className="rounded-lg p-0 backdrop:bg-black/40"
      onClose={onClose}
    >
      <div className="w-[420px] max-w-[95vw] space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-bgh-700">Finalizar parada</h3>
          <p className="text-xs text-bgh-400">{stop.label}</p>
        </div>

        <div>
          <label className="label-base">Rol que intervino</label>
          <select
            className="input-base"
            value={interventionRole}
            onChange={(e) => setInterventionRole(e.target.value as AppRole)}
          >
            {INTERVENTION_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Usuario intervinente</label>
          <select
            className="input-base"
            value={interventionUserId}
            onChange={(e) => setInterventionUserId(e.target.value)}
            disabled={filteredUsers.length === 0}
          >
            {filteredUsers.length === 0 && (
              <option value="">Sin usuarios activos para este rol</option>
            )}
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-bgh-400">
            Solo este usuario (o ADMIN) podrá validar o rechazar la parada.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary" disabled={busy}>
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="btn-primary"
            disabled={busy || filteredUsers.length === 0}
          >
            {busy ? "Finalizando..." : "Confirmar finalización"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function Filters({
  initial,
  lines,
  stations,
  onApply,
  onClear,
}: {
  initial: Record<string, string | undefined>;
  lines: Line[];
  stations: Station[];
  onApply: (patch: Record<string, string | undefined>) => void;
  onClear: () => void;
}) {
  const [smdLineId, setSmdLineId] = useState(initial.smdLineId ?? "");
  const [stationId, setStationId] = useState(initial.stationId ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [shift, setShift] = useState(initial.shift ?? "");
  const [openOnly, setOpenOnly] = useState(initial.open === "true");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    onApply({
      smdLineId: smdLineId || undefined,
      stationId: stationId || undefined,
      status: status || undefined,
      shift: shift || undefined,
      open: openOnly ? "true" : undefined,
    });
  }

  return (
    <form onSubmit={apply} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
      <div>
        <label className="label-base">Línea</label>
        <select className="input-base" value={smdLineId} onChange={(e) => setSmdLineId(e.target.value)}>
          <option value="">Todas</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-base">Estación</label>
        <select className="input-base" value={stationId} onChange={(e) => setStationId(e.target.value)}>
          <option value="">Todas</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-base">Estado</label>
        <select className="input-base" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="VALIDATED">Validada</option>
          <option value="REJECTED">Rechazada</option>
        </select>
      </div>
      <div>
        <label className="label-base">Turno</label>
        <select className="input-base" value={shift} onChange={(e) => setShift(e.target.value)}>
          <option value="">Todos</option>
          <option value="MORNING">Mañana</option>
          <option value="AFTERNOON">Tarde</option>
        </select>
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          Solo en curso
        </label>
      </div>
      <div className="flex items-end gap-2 justify-end">
        <button type="button" onClick={onClear} className="btn-secondary">Limpiar</button>
        <button type="submit" className="btn-primary">Filtrar</button>
      </div>
    </form>
  );
}

function StopsTable({
  stops,
  role,
  currentUserId,
  onClickEnd,
  onAction,
}: {
  stops: Stop[];
  role: AppRole;
  currentUserId: string;
  onClickEnd: (s: Stop) => void;
  onAction: () => void;
}) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Duración</th>
            <th>Línea</th>
            <th>WO</th>
            <th>Estación</th>
            <th>Falla</th>
            <th>Comentario</th>
            <th>Autor</th>
            <th>Resolvió</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stops.length === 0 && (
            <tr>
              <td colSpan={12} className="py-8 text-center text-bgh-400">Sin paradas.</td>
            </tr>
          )}
          {stops.map((s) => (
            <StopRow
              key={s.id}
              stop={s}
              role={role}
              currentUserId={currentUserId}
              onClickEnd={() => onClickEnd(s)}
              onAction={onAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StopRow({
  stop,
  role,
  currentUserId,
  onClickEnd,
  onAction,
}: {
  stop: Stop;
  role: AppRole;
  currentUserId: string;
  onClickEnd: () => void;
  onAction: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const startedAt = new Date(stop.startedAt);
  const endedAt = stop.endedAt ? new Date(stop.endedAt) : null;
  const duration = computeStopDurationSec(startedAt, endedAt);
  const failureLabel = stop.commonFailure?.label ?? stop.customFailure ?? "—";

  const canDecide =
    !!endedAt &&
    stop.status === "PENDING" &&
    (role === "ADMIN" || stop.interventionUser?.id === currentUserId);

  async function decide(decision: "VALIDATED" | "REJECTED") {
    let comment: string | null = null;
    if (decision === "REJECTED") {
      comment = prompt("Motivo del rechazo:");
      if (!comment || !comment.trim()) return;
    }
    setBusy(true);
    const res = await fetch(`/api/line-stops/${stop.id}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error");
      return;
    }
    onAction();
  }

  async function del() {
    if (!confirm("¿Borrar esta parada?")) return;
    setBusy(true);
    const res = await fetch(`/api/line-stops/${stop.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error");
      return;
    }
    onAction();
  }

  return (
    <tr>
      <td className="text-xs whitespace-nowrap">{startedAt.toLocaleString("es-AR")}</td>
      <td className="text-xs whitespace-nowrap">{endedAt ? endedAt.toLocaleString("es-AR") : "—"}</td>
      <td className="text-right">{formatDurationSec(duration)}</td>
      <td>{stop.smdLine.name}</td>
      <td>{stop.workOrder ? stop.workOrder.woNumber : "—"}</td>
      <td>{stop.station.name}</td>
      <td className="max-w-[200px] truncate" title={failureLabel}>{failureLabel}</td>
      <td className="max-w-[200px] truncate" title={stop.comment ?? ""}>
        {stop.comment ?? "—"}
      </td>
      <td>{stop.reportedBy.fullName}</td>
      <td>
        {stop.interventionUser ? (
          <>
            <div>{stop.interventionUser.fullName}</div>
            <div className="text-xs text-bgh-400">
              {ROLE_LABELS[stop.interventionUser.role]}
            </div>
          </>
        ) : (
          <span className="text-bgh-400">—</span>
        )}
      </td>
      <td>
        <StatusBadge status={stop.status} />
        {stop.validatedBy && (
          <div className="mt-0.5 text-xs text-bgh-400">{stop.validatedBy.fullName}</div>
        )}
        {stop.validatedComment && (
          <div className="mt-0.5 text-xs italic text-bgh-400" title={stop.validatedComment}>
            &ldquo;{stop.validatedComment.slice(0, 30)}{stop.validatedComment.length > 30 ? "..." : ""}&rdquo;
          </div>
        )}
      </td>
      <td className="space-x-1 whitespace-nowrap">
        {!endedAt && (
          <button className="btn-secondary" onClick={onClickEnd} disabled={busy}>
            Finalizar
          </button>
        )}
        {canDecide && (
          <>
            <button className="btn-primary" onClick={() => decide("VALIDATED")} disabled={busy}>
              Validar
            </button>
            <button className="btn-danger" onClick={() => decide("REJECTED")} disabled={busy}>
              Rechazar
            </button>
          </>
        )}
        {role === "ADMIN" && (
          <button className="btn-danger" onClick={del} disabled={busy}>
            Borrar
          </button>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "VALIDATED" | "REJECTED" }) {
  const map = {
    PENDING: { label: "Pendiente", cls: "bg-amber-50 text-amber-800" },
    VALIDATED: { label: "Validada", cls: "bg-bgh-50 text-bgh-700" },
    REJECTED: { label: "Rechazada", cls: "bg-red-50 text-red-700" },
  } as const;
  const x = map[status];
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${x.cls}`}>{x.label}</span>
  );
}
