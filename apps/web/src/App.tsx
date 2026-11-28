import { useMemo, useState } from 'react';
import { WorldScene, syntheticCells } from './world';

const terrainName: Record<string,string> = {
  urban:'Urban fabric', forest:'Woodland', park:'Green area',
  water:'Water corridor', other:'Open terrain'
};

export default function App() {
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [hoveredId, setHoveredId] = useState<string|null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const cells = useMemo(syntheticCells,[]);
  const selected = cells.find(c=>c.id===selectedId);
  const focus = cells.find(c=>c.id===hoveredId);
  const choose = (id:string) => setSelectedId(id || null);
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">C<span>·</span>M</div>
          <div><h1>CiviMadrid</h1><p>THE CITY IS YOUR STRATEGY</p></div>
        </div>
        <div className="headline-status">
          <span className="status-beacon" />
          <span>WORLD PROTOTYPE</span>
          <strong>SPATIAL SPIKE / M0</strong>
        </div>
        <button className="plain-button" onClick={()=>setShowInfo(x=>!x)} aria-expanded={showInfo}>
          {showInfo ? 'Close details' : 'About this prototype'}
        </button>
      </header>

      <main className="game">
        <section className="world" aria-label="Interactive synthetic hexagonal world">
          <WorldScene selectedId={selectedId} onSelect={choose} onHover={setHoveredId}/>
          <div className="world-label top-left">
            <span className="eyebrow">METROPOLITAN MADRID / CONCEPT</span>
            <strong>Make every choice count.</strong>
            <p>Explore a strategic landscape. The live game simulation will be integrated after its independent validation.</p>
          </div>
          <div className="map-warning" role="status">SYNTHETIC TERRAIN · NOT VERIFIED MADRID GEOGRAPHY</div>
          <div className="world-label bottom-left">
            <span className="eyebrow">WORLD VIEW</span>
            <strong>{focus ? `Cell ${focus.q + 1} · ${focus.r + 1}` : 'Drag to orbit · Scroll to zoom'}</strong>
            <p>{focus ? terrainName[focus.terrain] : 'Click any hex to inspect its prototype state.'}</p>
          </div>
          <div className="compass" aria-hidden="true">N<br/><span>↑</span></div>
        </section>

        <aside className="inspector">
          <div className="eyebrow">CAMPAIGN BRIEFING</div>
          <h2>Madrid, reconsidered.</h2>
          <p className="lead">Build a city that can grow without running out of water, power, land—or time.</p>
          <div className="chapter">
            <span className="chapter-index">CHAPTER 00</span><strong>Explore the territory</strong>
            <span className="chip">ACTIVE</span>
          </div>
          <div className="selection">
            {selected ? (
              <>
                <span className="eyebrow">SELECTED TERRITORY</span>
                <h3>Sector {selected.q + 1}—{selected.r + 1}</h3>
                <div className="property"><span>Terrain class</span><strong>{terrainName[selected.terrain]}</strong></div>
                <div className="property"><span>Cell origin</span><strong>Synthetic</strong></div>
                <div className="property"><span>Geographic precision</span><strong>Not surveyed</strong></div>
                <div className="property"><span>Available actions</span><strong>Inspection only</strong></div>
              </>
            ) : (
              <>
                <span className="eyebrow">TERRITORY INSPECTOR</span>
                <h3>Choose a hex</h3>
                <p>Select any tile to inspect its terrain. Construction actions activate only when the simulation is integrated.</p>
              </>
            )}
          </div>
          <div className="chapter queued"><span className="chapter-index">CHAPTER 01</span><strong>Shape the outcome</strong><span className="chip muted">PENDING</span></div>
          <div className="unavailable">Water · Solar · Housing · Turn progression<br/><span>Not yet connected — no simulated results shown.</span></div>
          {showInfo && (
            <div className="disclosure">
              <strong>Data integrity notice</strong>
              <p>This M0 art and interaction prototype uses procedurally generated coordinates and terrain types. It is not a map of observed Madrid elevations, land use, infrastructure or resources. Official geography and source attribution will be integrated separately.</p>
            </div>
          )}
          <footer className="inspector-footer">CIVIMADRID / ENGINEERING EDITION <span>v0.1 · M0</span></footer>
        </aside>
      </main>
    </div>
  );
}
