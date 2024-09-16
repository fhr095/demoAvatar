import React, { useState } from 'react';

function RenderingControls({ setLightingSettings, setBloomSettings, setRendererSettings }) {
  const [lightIntensity, setLightIntensity] = useState(1);
  const [bloomIntensity, setBloomIntensity] = useState(1.5);
  const [shadowIntensity, setShadowIntensity] = useState(1024);
  const [resolution, setResolution] = useState(1);
  const [reflectivity, setReflectivity] = useState(0.5);
  const [metalness, setMetalness] = useState(0);
  const [roughness, setRoughness] = useState(0.5);
  const [antialiasing, setAntialiasing] = useState(true);

  const handleLightChange = (e) => {
    const intensity = parseFloat(e.target.value);
    if (!isNaN(intensity) && intensity > 0) {
      setLightIntensity(intensity);
      setLightingSettings((prev) => ({ ...prev, intensity }));
    }
  };

  const handleBloomChange = (e) => {
    const intensity = parseFloat(e.target.value);
    if (!isNaN(intensity) && intensity >= 0) {
      setBloomIntensity(intensity);
      setBloomSettings({ bloomIntensity: intensity });
    }
  };

  const handleShadowChange = (e) => {
    const shadowSize = parseInt(e.target.value);
    if (!isNaN(shadowSize) && shadowSize >= 512) {
      setShadowIntensity(shadowSize);
      setLightingSettings((prev) => ({ ...prev, shadowSize }));
    }
  };

  const handleResolutionChange = (e) => {
    const resolution = parseFloat(e.target.value);
    if (!isNaN(resolution) && resolution >= 0.5) {
      setResolution(resolution);
      setRendererSettings((prev) => ({ ...prev, resolution }));
    }
  };

  const handleReflectivityChange = (e) => {
    const reflectivity = parseFloat(e.target.value);
    if (!isNaN(reflectivity)) {
      setReflectivity(reflectivity);
      setLightingSettings((prev) => ({ ...prev, reflectivity }));
    }
  };

  const handleMetalnessChange = (e) => {
    const metalness = parseFloat(e.target.value);
    if (!isNaN(metalness)) {
      setMetalness(metalness);
      setLightingSettings((prev) => ({ ...prev, metalness }));
    }
  };

  const handleRoughnessChange = (e) => {
    const roughness = parseFloat(e.target.value);
    if (!isNaN(roughness)) {
      setRoughness(roughness);
      setLightingSettings((prev) => ({ ...prev, roughness }));
    }
  };

  const handleAntialiasingChange = (e) => {
    const isEnabled = e.target.checked;
    setAntialiasing(isEnabled);
    setRendererSettings((prev) => ({ ...prev, antialiasing: isEnabled }));
  };

  return (
    <div className="rendering-controls">
      <h3>Rendering Controls</h3>
      <div className="control-group">
        <label>Light Intensity</label>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={lightIntensity}
          onChange={handleLightChange}
        />
        <span>{lightIntensity}</span>
      </div>
      <div className="control-group">
        <label>Bloom Intensity</label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={bloomIntensity}
          onChange={handleBloomChange}
        />
        <span>{bloomIntensity}</span>
      </div>
      <div className="control-group">
        <label>Shadow Map Size</label>
        <input
          type="range"
          min="512"
          max="2048"
          step="256"
          value={shadowIntensity}
          onChange={handleShadowChange}
        />
        <span>{shadowIntensity}</span>
      </div>
      <div className="control-group">
        <label>Resolution</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={resolution}
          onChange={handleResolutionChange}
        />
        <span>{resolution}</span>
      </div>
      <div className="control-group">
        <label>Reflectivity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={reflectivity}
          onChange={handleReflectivityChange}
        />
        <span>{reflectivity}</span>
      </div>
      <div className="control-group">
        <label>Metalness</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={metalness}
          onChange={handleMetalnessChange}
        />
        <span>{metalness}</span>
      </div>
      <div className="control-group">
        <label>Roughness</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={roughness}
          onChange={handleRoughnessChange}
        />
        <span>{roughness}</span>
      </div>
      <div className="control-group">
        <label>Antialiasing</label>
        <input
          type="checkbox"
          checked={antialiasing}
          onChange={handleAntialiasingChange}
        />
        <span>{antialiasing ? 'On' : 'Off'}</span>
      </div>
    </div>
  );
}

export default RenderingControls;
