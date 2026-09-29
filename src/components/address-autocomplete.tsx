import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { addressSearchAvailable, findAddress } from "@/server/address-search";
import type { AddressSuggestion } from "@/lib/address-suggestions";
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: AddressSuggestion) => void;
  onBlur: () => void;
  error: string | undefined;
}) {
  const [enabled, setEnabled] = useState(false),
    [active, setActive] = useState(false),
    [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]),
    [index, setIndex] = useState(-1),
    [loading, setLoading] = useState(false),
    [note, setNote] = useState("");
  useEffect(() => {
    let alive = true;
    void addressSearchAvailable()
      .then((v) => {
        if (alive) setEnabled(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!enabled || !active || query.trim().length < 4) return;
    let alive = true;
    const timer = setTimeout(() => {
      setLoading(true);
      void findAddress({ data: { query } })
        .then((result) => {
          if (alive) {
            setSuggestions(result.suggestions);
            setIndex(-1);
            setNote(
              result.unavailable
                ? "Suggestions are unavailable. Please enter your address manually."
                : result.suggestions.length
                  ? ""
                  : "No matches found. You can enter the address manually.",
            );
          }
        })
        .catch(() => {
          if (alive) setNote("Please enter your address manually.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled, active, query]);
  const choose = (item: AddressSuggestion) => {
    onSelect(item);
    setActive(false);
    setSuggestions([]);
    setQuery("");
    setLoading(false);
    setNote("Address filled. Check the details and add your apartment if needed.");
  };
  const open = active && suggestions.length > 0;
  return (
    <div className="address-lookup">
      <label className="delivery-label" htmlFor="delivery-address">
        Street address
      </label>
      <input
        id="delivery-address"
        name="address"
        value={value}
        role={enabled ? "combobox" : undefined}
        aria-autocomplete={enabled ? "list" : undefined}
        aria-expanded={enabled ? open : undefined}
        aria-controls={open ? "address-suggestions" : undefined}
        aria-activedescendant={open && index >= 0 ? `address-option-${index}` : undefined}
        autoComplete={enabled ? "off" : "shipping address-line1"}
        maxLength={200}
        placeholder="Street number and name"
        className="delivery-input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "address-error" : "address-search-help"}
        onFocus={() => setActive(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setActive(true);
          setSuggestions([]);
          setIndex(-1);
          setNote("");
          setLoading(false);
        }}
        onBlur={() => {
          setActive(false);
          setLoading(false);
          onBlur();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setActive(false);
            setLoading(false);
            return;
          }
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => (i + 1) % suggestions.length);
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
          }
          if (e.key === "Enter" && index >= 0) {
            e.preventDefault();
            const item = suggestions[index];
            if (item) choose(item);
          }
        }}
      />
      {open && (
        <ul
          id="address-suggestions"
          role="listbox"
          aria-label="Suggested addresses"
          className="address-suggestions"
        >
          {suggestions.map((item, i) => (
            <li
              id={`address-option-${i}`}
              key={`${item.label}-${i}`}
              role="option"
              aria-selected={i === index}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setIndex(i)}
              onClick={() => choose(item)}
              className={i === index ? "is-active" : ""}
            >
              <MapPin size={15} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <small id="address-error" className="delivery-error">
          {error}
        </small>
      )}
      <p id="address-search-help" role="status" className="delivery-muted">
        {loading
          ? "Finding addresses…"
          : note ||
            (enabled
              ? "Start typing your South African address, or enter it manually."
              : "You can use your browser's saved address or enter it manually.")}
      </p>
      {enabled && (
        <p className="address-attribution">
          Address search shares the typed street query with{" "}
          <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">
            Geoapify
          </a>
          . Data:{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            © OpenStreetMap contributors
          </a>
          .
        </p>
      )}
    </div>
  );
}
