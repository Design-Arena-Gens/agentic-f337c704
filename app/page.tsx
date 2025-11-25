'use client';

import { useEffect, useMemo, useState } from 'react';

type Rule = {
  id: string;
  keyword: string;
  reply: string;
  enabled: boolean;
};

const DEFAULT_RULES: Rule[] = [
  {
    id: 'auto-greeting',
    keyword: '*',
    reply:
      "Hi! Thanks for your message about the item. I'm currently away from my phone but will reply shortly. In the meantime:\n\n- Item is available unless marked sold ?\n- Pickup near [Your Area]\n- Cash or instant transfer on pickup\n- If you?d like to reserve, please share your pickup day/time\n\nTalk soon!",
    enabled: true,
  },
  {
    id: 'is-available',
    keyword: 'available',
    reply:
      "Yes, it's available! When would you like to pick it up? I?m near [Your Area].",
    enabled: true,
  },
  {
    id: 'lowest-price',
    keyword: 'lowest|best price|less|offer|discount|negot',
    reply:
      "I?m getting a lot of interest and the price is firm for now. Happy to prioritize pickup if you can collect today.",
    enabled: true,
  },
  {
    id: 'address',
    keyword: 'address|where|location|meet',
    reply:
      "Pickup is near [Your Area]. I?ll share the exact address once we confirm a pickup time.",
    enabled: true,
  },
];

function loadRules(): Rule[] {
  try {
    const raw = localStorage.getItem('rules.v1');
    if (!raw) return DEFAULT_RULES;
    const parsed = JSON.parse(raw) as Rule[];
    if (!Array.isArray(parsed)) return DEFAULT_RULES;
    return parsed;
  } catch {
    return DEFAULT_RULES;
  }
}

function saveRules(rules: Rule[]) {
  localStorage.setItem('rules.v1', JSON.stringify(rules));
}

export default function Page() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [compose, setCompose] = useState({
    buyerMessage: '',
    itemTitle: '',
    price: '',
    area: '',
  });
  const [generated, setGenerated] = useState('');

  useEffect(() => {
    setRules(loadRules());
  }, []);

  useEffect(() => {
    if (rules.length) saveRules(rules);
  }, [rules]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), keyword: '', reply: '', enabled: true },
    ]);
  };
  const removeRule = (id: string) =>
    setRules((prev) => prev.filter((r) => r.id !== id));
  const updateRule = (id: string, patch: Partial<Rule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const compiled = useMemo(() => {
    let content = compose.buyerMessage.toLowerCase();
    const matched =
      rules.find(
        (r) =>
          r.enabled &&
          (r.keyword.trim() === '*'
            ? content.length >= 0
            : new RegExp(r.keyword, 'i').test(content))
      ) || null;
    const template =
      matched?.reply ||
      "Thanks for reaching out! I'll get back to you shortly.";
    const withVars = template
      .replaceAll('[Your Area]', compose.area || 'my area')
      .replaceAll('{item}', compose.itemTitle || 'the item')
      .replaceAll('{price}', compose.price || 'the listed price');
    return { template: withVars, matched };
  }, [compose, rules]);

  useEffect(() => {
    setGenerated(compiled.template);
  }, [compiled]);

  const copy = async () => {
    await navigator.clipboard.writeText(generated);
  };

  return (
    <div className="container">
      <div className="grid grid-2">
        <div className="card">
          <div className="title">Reply composer</div>
          <div className="subtitle">
            Paste the buyer&apos;s message. We&apos;ll suggest a quick reply
            based on your rules.
          </div>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Item title</label>
              <input
                placeholder="e.g., iPhone 13 128GB"
                value={compose.itemTitle}
                onChange={(e) =>
                  setCompose((c) => ({ ...c, itemTitle: e.target.value }))
                }
              />
            </div>
            <div style={{ width: 140 }}>
              <label>Price</label>
              <input
                placeholder="$320"
                value={compose.price}
                onChange={(e) =>
                  setCompose((c) => ({ ...c, price: e.target.value }))
                }
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label>Your area</label>
              <input
                placeholder="e.g., Downtown"
                value={compose.area}
                onChange={(e) =>
                  setCompose((c) => ({ ...c, area: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="spacer" />
          <label>Buyer message</label>
          <textarea
            placeholder="Paste message here?"
            value={compose.buyerMessage}
            onChange={(e) =>
              setCompose((c) => ({ ...c, buyerMessage: e.target.value }))
            }
          />
          <div className="spacer" />
          <label>Suggested reply</label>
          <div className="code" style={{ minHeight: 120 }}>{generated}</div>
          <div className="spacer" />
          <div className="row">
            <button className="btn" onClick={copy}>
              Copy reply
            </button>
            <span className="pill">
              Matched rule:{' '}
              <strong className="mono">
                {compiled.matched?.id ?? 'default'}
              </strong>
            </span>
          </div>
        </div>

        <div className="card">
          <div className="title">Rules & templates</div>
          <div className="subtitle">
            Use regex keywords. Use variables: <span className="pill">{'{item}'}</span>{' '}
            <span className="pill">{'{price}'}</span>{' '}
            <span className="pill">[Your Area]</span>. Use <span className="pill">*</span> to match any message.
          </div>
          <div className="list">
            {rules.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div className="row" style={{ alignItems: 'center' }}>
                  <label style={{ margin: 0, marginRight: 8 }}>Enabled</label>
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => updateRule(r.id, { enabled: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                </div>
                <div className="spacer" />
                <label>Keyword (regex)</label>
                <input
                  placeholder="e.g., available|in stock|still have"
                  value={r.keyword}
                  onChange={(e) => updateRule(r.id, { keyword: e.target.value })}
                />
                <div className="spacer" />
                <label>Reply template</label>
                <textarea
                  placeholder="Your reply?"
                  value={r.reply}
                  onChange={(e) => updateRule(r.id, { reply: e.target.value })}
                />
                <div className="spacer" />
                <div className="row">
                  <button className="btn danger" onClick={() => removeRule(r.id)}>
                    Delete rule
                  </button>
                  <span className="muted mono">id: {r.id}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="spacer" />
          <div className="row">
            <button className="btn success" onClick={addRule}>
              Add rule
            </button>
            <button
              className="btn secondary"
              onClick={() => setRules(DEFAULT_RULES)}
              title="Reset to sensible defaults"
            >
              Reset defaults
            </button>
          </div>
        </div>
      </div>

      <div className="spacer" />
      <div className="card">
        <div className="title">Optional: Enable automatic replies via Messenger</div>
        <div className="subtitle">
          If you have a Facebook Page connected to Marketplace messages, you can
          set up a Messenger webhook to auto-reply with a default message.
        </div>
        <ol>
          <li>
            Set these environment variables in your Vercel project:
            <div className="code mono">
              FACEBOOK_VERIFY_TOKEN=choose-a-secret{'\n'}
              FACEBOOK_PAGE_ACCESS_TOKEN=EAAG... (Page token)
              {'\n'}
              DEFAULT_REPLY_TEXT=Thanks for your message! I will reply shortly.
            </div>
          </li>
          <li>
            In your Facebook App dashboard, add the callback URL:{' '}
            <span className="mono">
              https://agentic-f337c704.vercel.app/api/webhook
            </span>{' '}
            and the verify token you set above. Subscribe to{" "}
            <span className="pill">messages</span> for your Page.
          </li>
          <li>
            Facebook will send a GET verify request; if tokens match, it will be
            accepted. Incoming messages will trigger an automatic reply.
          </li>
        </ol>
        <div className="subtitle">
          Note: Automated Marketplace replies may be subject to Facebook policies. Use responsibly.
        </div>
      </div>
    </div>
  );
}

