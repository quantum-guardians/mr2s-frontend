import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ApiTarget } from "../types.ts";

type GraphInputProps = {
  verticesRaw: string;
  edgesRaw: string;
  defaultWeight: number;
  onVerticesChange: (v: string) => void;
  onEdgesChange: (e: string) => void;
  onDefaultWeightChange: (w: number) => void;
  onDrawGraph: () => void;
  onOptimize: () => void;
  onReset: () => void;
  onBenchmark: () => void;
  canDraw: boolean;
  canOptimize: boolean;
  benchmarkLoading: boolean;
  error: string | null;
  apiTarget: ApiTarget;
  onApiTargetChange: (target: ApiTarget) => void;
};

export function GraphInput({
  verticesRaw,
  edgesRaw,
  defaultWeight,
  onVerticesChange,
  onEdgesChange,
  onDefaultWeightChange,
  onDrawGraph,
  onOptimize,
  onReset,
  onBenchmark,
  canDraw,
  canOptimize,
  benchmarkLoading,
  error,
  apiTarget,
  onApiTargetChange,
}: GraphInputProps) {
  const { t } = useTranslation();
  return (
    <div className="graph-input">
      <h3>{t("graphInput.title")}</h3>

      <div className="field">
        <label>{t("graphInput.apiSelection")}</label>
        <div className="api-toggle">
          <label>
            <input
              type="radio"
              name="api-target"
              value="small-world"
              checked={apiTarget === "small-world"}
              onChange={(e) => onApiTargetChange(e.target.value as ApiTarget)}
            />
            Small World
          </label>
          <label>
            <input
              type="radio"
              name="api-target"
              value="naoto"
              checked={apiTarget === "naoto"}
              onChange={(e) => onApiTargetChange(e.target.value as ApiTarget)}
            />
            Naoto
          </label>
        </div>
      </div>

      <div className="field">
        <label htmlFor="vertices">{t("graphInput.vertices")}</label>
        <input
          id="vertices"
          type="text"
          value={verticesRaw}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onVerticesChange(e.target.value)
          }
          placeholder={t("graphInput.verticesPlaceholder")}
        />
      </div>

      <div className="field">
        <label htmlFor="edges">{t("graphInput.edges")}</label>
        <textarea
          id="edges"
          value={edgesRaw}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onEdgesChange(e.target.value)
          }
          placeholder={t("graphInput.edgesPlaceholder")}
          rows={5}
        />
      </div>

      <div className="field">
        <label htmlFor="default-weight">{t("graphInput.defaultWeight")}</label>
        <input
          id="default-weight"
          type="number"
          value={defaultWeight}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onDefaultWeightChange(Number(e.target.value))
          }
          min={0}
          step={1}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="buttons">
        <button
          className="btn-primary"
          onClick={onDrawGraph}
          disabled={!canDraw}
        >
          {t("graphInput.drawGraph")}
        </button>
        <button
          className="btn-primary"
          onClick={onOptimize}
          disabled={!canOptimize}
        >
          {t("graphInput.pathSearch")}
        </button>
        <button className="btn-secondary" onClick={onReset} type="button">
          {t("graphInput.reset")}
        </button>
        <button
          className="btn-benchmark"
          onClick={onBenchmark}
          disabled={benchmarkLoading}
          type="button"
        >
          {t("graphInput.runBenchmark")}
        </button>
      </div>
    </div>
  );
}
