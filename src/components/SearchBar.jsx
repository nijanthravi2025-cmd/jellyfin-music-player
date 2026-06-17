import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SearchBar.css";

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  // Sync input value with URL parameter
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val)}`);
    } else {
      navigate(`/search?q=`);
    }
  };

  return (
    <div className="search-container">
      <Search className="search-icon" />
      <input
        className="search-box"
        type="search"
        placeholder="Search"
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}
