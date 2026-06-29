import { useState, useEffect } from "react";
import "./App.css";

const DISEASES = [
  "DIABETES",
  "HYPERTENSION",
  "HEART_DISEASE",
  "ASTHMA",
  "THYROID",
  "ARTHRITIS",
  "KIDNEY_DISEASE",
  "CANCER",
];

const DISEASE_LABELS = {
  DIABETES: "Diabetes",
  HYPERTENSION: "Hypertension",
  HEART_DISEASE: "Heart disease",
  ASTHMA: "Asthma",
  THYROID: "Thyroid",
  ARTHRITIS: "Arthritis",
  KIDNEY_DISEASE: "Kidney disease",
  CANCER: "Cancer",
};

const RELATIONSHIPS = ["SELF", "SPOUSE", "SON", "DAUGHTER", "FATHER", "MOTHER"];

const CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Gurugram",
  "Noida",
  "Agra",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Patna",
  "Chandigarh",
  "Surat",
  "Vadodara",
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const fmt = (n) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");

export default function App() {
  const [view, setView] = useState("form");
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);

  const [planCode, setPlanCode] = useState("");
  const [sumInsured, setSumInsured] = useState("");
  const [tenure, setTenure] = useState("");
  const [city, setCity] = useState("");
  const [ncbYears, setNcbYears] = useState("0");

  const [members, setMembers] = useState([
    {
      id: 1,
      relationship: "",
      age: "",
      gender: "",
      bmi: "",
      isSmoker: false,
      diseases: [],
      heightCm: "",
      weightKg: "",
    },
  ]);

  const [selectedAddons, setSelectedAddons] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiOutput, setAiOutput] = useState(null);
  // const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingType, setAiLoadingType] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/plans`)
      .then((r) => r.json())
      .then((data) => setPlans(data || []))
      .catch(() => {});

    fetch(`${API_BASE}/plans/addons`)
      .then((r) => r.json())
      .then((data) => setAddons(data || []))
      .catch(() => {});
  }, []);

  const updateMember = (id, field, value) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              [field]:
                field === "age" || field === "bmi"
                  ? value === ""
                    ? ""
                    : parseFloat(value)
                  : field === "isSmoker"
                  ? value === "true"
                  : value,
            }
          : m
      )
    );
  };

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        relationship: "",
        age: "",
        gender: "",
        bmi: "",
        isSmoker: false,
        diseases: [],
        heightCm: "",
        weightKg: "",
      },
    ]);
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleDisease = (id, disease) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              diseases: m.diseases.includes(disease)
                ? m.diseases.filter((d) => d !== disease)
                : [...m.diseases, disease],
            }
          : m
      )
    );
  };

  const toggleAddon = (code) => {
    setSelectedAddons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const calculateBmi = (id) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;

        const heightInMeter = Number(m.heightCm) / 100;
        const weight = Number(m.weightKg);

        if (!heightInMeter || !weight) return m;

        const bmi = weight / (heightInMeter * heightInMeter);

        return {
          ...m,
          bmi: Number(bmi.toFixed(1)),
        };
      })
    );
  };

  const validateForm = () => {
    const errors = {};

    if (!planCode) errors.planCode = "Plan is required";
    if (!sumInsured) errors.sumInsured = "Sum insured is required";
    if (!tenure) errors.tenure = "Tenure is required";
    if (!city.trim()) errors.city = "City is required";

    members.forEach((m, index) => {
      if (!m.relationship) {
        errors[`member_${index}_relationship`] = "Relationship is required";
      }

      if (!m.age || Number(m.age) < 1 || Number(m.age) > 99) {
        errors[`member_${index}_age`] = "Enter valid age between 1 and 99";
      }

      if (!m.gender) {
        errors[`member_${index}_gender`] = "Gender is required";
      }

      if (!m.bmi || Number(m.bmi) < 10 || Number(m.bmi) > 60) {
        errors[`member_${index}_bmi`] = "Enter valid BMI between 10 and 60";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/quotes/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `quote-${Date.now()}`,
        },
        body: JSON.stringify({
          planCode,
          sumInsured: parseInt(sumInsured),
          tenure: parseInt(tenure),
          city,
          ncbYears: parseInt(ncbYears),
          members: members.map((m) => ({
            relationship: m.relationship,
            age: Number(m.age),
            gender: m.gender,
            bmi: Number(m.bmi),
            isSmoker: m.isSmoker,
            preExistingDiseases: m.diseases,
          })),
          addonCodes: selectedAddons,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Calculation failed");

      setResult(data);
      setView("result");
      setAiOutput(null);
    } catch (e) {
      setError(
        "Could not connect to API. Make sure services are running on localhost:3000. " +
          e.message
      );
    } finally {
      setLoading(false);
    }
  };

  const getAi = async (type) => {
    // setAiLoading(true);
    setAiLoadingType(type);
    setAiOutput(null);

    try {
      const res = await fetch(`${API_BASE}/quotes/${result.quoteId}/${type}`);
      const data = await res.json();

      if (type === "explain") {
        setAiOutput({
          type: "text",
          title: "Premium Explanation",
          text: data.explanation,
        });
      } else if (type === "suggest") {
        setAiOutput({
          type: "text",
          title: "Plan Suggestion",
          text: data.suggestion,
        });
      } else {
        setAiOutput({
          type: "underwriting",
          review: data.review,
        });
      }
    } catch (e) {
      setAiOutput({
        type: "text",
        title: "AI Error",
        text: "Could not get AI response: " + e.message,
      });
    } finally {
      // setAiLoading(false);
      setAiLoadingType(null);
    }
  };

  const getRiskClass = (band) => {
    if (band === "HIGH") return "risk-high";
    if (band === "MEDIUM") return "risk-medium";
    return "risk-low";
  };

  if (view === "result" && result) {
    const bd = result.breakdown;

    return (
      <div className="app">
        <button
          className="back-btn"
          onClick={() => {
            setView("form");
            setResult(null);
            setAiOutput(null);
          }}
        >
          ← Back
        </button>

        <div className="header">
          <h1>{result.plan?.name}</h1>
          <p>
            {result.plan?.city} · {fmt(result.plan?.sumInsured)} cover ·{" "}
            {result.plan?.tenure} yr{" "}
            <span className={`tag ${result.cached ? "warning" : "success"}`}>
              {result.cached ? "Cached" : "Fresh"}
            </span>
          </p>
        </div>

        <div className="premium-hero">
          <div className="premium-label">Total annual premium</div>
          <div className="premium-amount">{fmt(bd.totalPremium)}</div>
          <div className="premium-sub">
            Before GST: {fmt(bd.premiumBeforeGST)} · GST 18%: {fmt(bd.gst)}
          </div>
        </div>

        <div className="breakdown-grid">
          {[
            ["Base premium", bd.basePremiumPerMember],
            ["Combined premium", bd.combinedMemberPremium],
            ["Add-ons total", bd.totalAddonPremium],
            ["GST 18%", bd.gst],
          ].map(([l, v]) => (
            <div className="metric" key={l}>
              <div className="metric-label">{l}</div>
              <div className="metric-value">{fmt(v)}</div>
            </div>
          ))}
        </div>

        {result.members?.length > 0 && (
          <div className="card">
            <div className="card-title">Per member breakdown</div>

            {result.members.map((m, i) => (
              <div className="member-breakdown" key={i}>
                <div className="mb-header">
                  <span className="mb-name">
                    {m.relationship} · Age {m.age}
                  </span>
                  <span className="mb-premium">{fmt(m.finalMemberPremium)}</span>
                </div>

                {Object.entries(m.loadings || {}).map(([k, v]) => (
                  <div className="loading-item" key={k}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="ai-section">
          <button
            className="ai-btn"
            onClick={() => getAi("explain")}
            disabled={!!aiLoadingType}
          >
            {aiLoadingType === "explain" ? "Getting explanation..." : "Explain this premium with AI"}
          </button>

          <button
            className="ai-btn"
            onClick={() => getAi("suggest")}
            disabled={!!aiLoadingType}
          >
            {aiLoadingType === "suggest"  ? "Getting suggestion..." : "Suggest a better plan"}
          </button>

          <button
            className="ai-btn primary-ai"
            onClick={() => getAi("underwriting-review")}
            disabled={!!aiLoadingType}
          >
            {aiLoadingType === "underwriting-review" ? "Running AI underwriting..." : "Run AI Underwriting Review"}
          </button>

          {aiOutput?.type === "text" && (
            <div className="ai-result">
              <div className="ai-result-title">✨ {aiOutput.title}</div>
              <div className="ai-result-text">{aiOutput.text}</div>
            </div>
          )}

          {aiOutput?.type === "underwriting" && (
            <div className="underwriting-card">
              <div className="uw-header">
                <div>
                  <div className="uw-kicker">AI Risk Intelligence</div>
                  <h3>Underwriting Review</h3>
                </div>

                <div
                  className={`risk-badge ${getRiskClass(
                    aiOutput.review?.riskBand
                  )}`}
                >
                  {aiOutput.review?.riskBand || "LOW"}
                </div>
              </div>

              <div className="uw-score-box">
                <div>
                  <div className="uw-label">Risk Score</div>
                  <div className="uw-score">
                    {aiOutput.review?.riskScore ?? 0}
                    <span>/100</span>
                  </div>
                </div>

                <div>
                  <div className="uw-label">Decision</div>
                  <div className="uw-decision">
                    {aiOutput.review?.underwritingDecision || "AUTO_APPROVE"}
                  </div>
                </div>
              </div>

              <div className="uw-grid">
                <div className="uw-panel">
                  <h4>Risk Reasons</h4>
                  <ul>
                    {aiOutput.review?.reasons?.length ? (
                      aiOutput.review.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))
                    ) : (
                      <li>No major risk factors detected</li>
                    )}
                  </ul>
                </div>

                <div className="uw-panel">
                  <h4>Missing Questions</h4>
                  <ul>
                    {aiOutput.review?.missingQuestions?.length ? (
                      aiOutput.review.missingQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))
                    ) : (
                      <li>No additional questions required</li>
                    )}
                  </ul>
                </div>

                <div className="uw-panel">
                  <h4>Documents Required</h4>
                  <ul>
                    {aiOutput.review?.recommendedDocuments?.length ? (
                      aiOutput.review.recommendedDocuments.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))
                    ) : (
                      <li>No extra documents required</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="uw-action">
                <strong>Recommended Action</strong>
                <p>{aiOutput.review?.recommendedAction}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Health insurance premium calculator</h1>
        <p>Get an instant quote based on your profile</p>
      </div>

      <div className="card">
        <div className="card-title">Plan details</div>

        <div className="form-row three">
          <div className="field">
            <label>Plan</label>
            <select value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
              <option value="">Select plan</option>
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            {validationErrors.planCode && (
              <div className="field-error">{validationErrors.planCode}</div>
            )}
          </div>

          <div className="field">
            <label>Sum insured</label>
            <select
              value={sumInsured}
              onChange={(e) => setSumInsured(e.target.value)}
            >
              <option value="">Select sum insured</option>
              <option value="100000">₹1 lakh</option>
              <option value="300000">₹3 lakh</option>
              <option value="500000">₹5 lakh</option>
              <option value="1000000">₹10 lakh</option>
              <option value="2000000">₹20 lakh</option>
            </select>
            {validationErrors.sumInsured && (
              <div className="field-error">{validationErrors.sumInsured}</div>
            )}
          </div>

          <div className="field">
            <label>Tenure</label>
            <select value={tenure} onChange={(e) => setTenure(e.target.value)}>
              <option value="">Select tenure</option>
              <option value="1">1 year</option>
              <option value="2">2 years −5%</option>
              <option value="3">3 years −10%</option>
            </select>
            {validationErrors.tenure && (
              <div className="field-error">{validationErrors.tenure}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Select city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {validationErrors.city && (
              <div className="field-error">{validationErrors.city}</div>
            )}
          </div>

          <div className="field">
            <label>NCB years</label>
            <select value={ncbYears} onChange={(e) => setNcbYears(e.target.value)}>
              <option value="0">0 years</option>
              <option value="1">1 year −5%</option>
              <option value="2">2 years −10%</option>
              <option value="3">3+ years −15%</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Members</div>

        {members.map((m, idx) => (
          <div className="member-card" key={m.id}>
            {members.length > 1 && (
              <button className="remove-btn" onClick={() => removeMember(m.id)}>
                ×
              </button>
            )}

            <div className="member-title">Member {idx + 1}</div>

            <div className="form-row three">
              <div className="field">
                <label>Relationship</label>
                <select
                  value={m.relationship}
                  onChange={(e) =>
                    updateMember(m.id, "relationship", e.target.value)
                  }
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {validationErrors[`member_${idx}_relationship`] && (
                  <div className="field-error">
                    {validationErrors[`member_${idx}_relationship`]}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Age</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={m.age}
                  onChange={(e) => updateMember(m.id, "age", e.target.value)}
                />
                {validationErrors[`member_${idx}_age`] && (
                  <div className="field-error">
                    {validationErrors[`member_${idx}_age`]}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Gender</label>
                <select
                  value={m.gender}
                  onChange={(e) => updateMember(m.id, "gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
                {validationErrors[`member_${idx}_gender`] && (
                  <div className="field-error">
                    {validationErrors[`member_${idx}_gender`]}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>BMI Calculator</label>

                <div className="bmi-row">
                  <input
                    type="number"
                    placeholder="Height cm"
                    value={m.heightCm}
                    onChange={(e) =>
                      updateMember(m.id, "heightCm", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Weight kg"
                    value={m.weightKg}
                    onChange={(e) =>
                      updateMember(m.id, "weightKg", e.target.value)
                    }
                  />

                  <button type="button" onClick={() => calculateBmi(m.id)}>
                    Calc
                  </button>
                </div>

                <input
                  type="number"
                  min="10"
                  max="60"
                  step="0.1"
                  value={m.bmi}
                  onChange={(e) => updateMember(m.id, "bmi", e.target.value)}
                  placeholder="BMI"
                />

                {validationErrors[`member_${idx}_bmi`] && (
                  <div className="field-error">
                    {validationErrors[`member_${idx}_bmi`]}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Smoker</label>
                <select
                  value={String(m.isSmoker)}
                  onChange={(e) =>
                    updateMember(m.id, "isSmoker", e.target.value)
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Pre-existing conditions</label>
              <div className="disease-grid">
                {DISEASES.map((d) => (
                  <div
                    key={d}
                    className={`disease-chip ${
                      m.diseases.includes(d) ? "active" : ""
                    }`}
                    onClick={() => toggleDisease(m.id, d)}
                  >
                    {DISEASE_LABELS[d]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button className="add-btn" onClick={addMember}>
          + Add member
        </button>
      </div>

      <div className="card">
        <div className="card-title">Add-ons</div>

        <div className="addon-grid">
          {addons.length > 0 ? (
            addons.map((a) => (
              <div
                key={a.code}
                className={`addon-item ${
                  selectedAddons.includes(a.code) ? "active" : ""
                }`}
                onClick={() => toggleAddon(a.code)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedAddons.includes(a.code)}
                />

                <div className="addon-info">
                  <div className="addon-name">{a.name}</div>
                  <div className="addon-price">
                    {fmt(a.annualPremium)}/yr · {fmt(a.coverageAmount)} cover
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Loading add-ons...</p>
          )}
        </div>
      </div>

      <button className="calc-btn" onClick={calculate} disabled={loading}>
        {loading ? "Calculating..." : "Calculate premium"}
      </button>

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}