import React, { useState, useEffect } from "react";

function App() {
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [materia, setMateria] = useState("MATERIA PENTATEUCO");
  const [fechaCurso, setFechaCurso] = useState("MARZO A BRIL 2023");
  const [fileName, setFileName] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Test conexión con el backend al cargar
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/");
        const data = await response.json();
        console.log("✅ Backend conectado:", data);
      } catch (error) {
        console.log("⚠️ Backend no disponible aún, reintentando...");
        // Reintentar después de 2 segundos
        setTimeout(testConnection, 2000);
      }
    };
    
    testConnection();
  }, []);

  // Crear plantilla vacía para nuevas calificaciones
  const createNewTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/create-empty-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          student_count: studentsCount,
          materia: materia,
          fecha_curso: fechaCurso
        })
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const data = await response.json();
      setColumnDefs(data.columns.map(col => ({ field: col })));
      setRowData(data.data);
      setCurrentFile("nueva_plantilla");
      alert("Plantilla creada con éxito");
    } catch (error) {
      console.error("Error creando plantilla:", error);
      alert("Error al crear plantilla: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales automáticamente
  const calculateTotals = async () => {
    if (!rowData || rowData.length === 0) {
      alert("No hay datos para calcular");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/calculate-totals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: rowData })
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const result = await response.json();
      console.log("Resultado de calcular totales:", result); // Debug
      
      if (result.success && result.data) {
        setRowData(result.data);
        alert("Totales calculados automáticamente");
      } else {
        throw new Error(result.error || "Error al calcular totales");
      }
    } catch (error) {
      console.error("Error calculando totales:", error);
      alert("Error al calcular totales: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveGrades = async () => {
    if (!rowData || rowData.length === 0) {
      alert("No hay datos para guardar");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/save-grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: rowData,
          materia: materia,
          fecha_curso: fechaCurso
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const result = await response.json();
      
      // Convertir hex a blob y descargar
      const bytes = new Uint8Array(result.file.length / 2);
      for (let i = 0; i < result.file.length; i += 2) {
        bytes[i / 2] = parseInt(result.file.substr(i, 2), 16);
      }
      
      const blob = new Blob([bytes], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const finalFileName = (fileName.trim() || 'calificaciones').replace(/[<>:"/\\|?*]/g, '_');
      a.download = `${finalFileName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Calificaciones guardadas y descargadas");
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar: " + error.message);
    }
  };

  return (
    <div style={{ 
      padding: isMobile ? 10 : 20,
      paddingBottom: isMobile ? 150 : 20
    }}>
      {/* Encabezado principal que simula el Excel */}
      <div style={{ 
        border: "2px solid #000", 
        backgroundColor: "#fff", 
        marginBottom: 20,
        fontFamily: "Arial, sans-serif",
        marginRight: isMobile ? 0 : 320
      }}>
        {/* Encabezados del instituto */}
        <div style={{ 
          textAlign: "center", 
          padding: "10px", 
          borderBottom: "1px solid #000",
          fontSize: isMobile ? "14px" : "16px",
          fontWeight: "bold"
        }}>
          UNIVERSIDAD BIBLICA HARVEST.
        </div>
        <div style={{ 
          textAlign: "center", 
          padding: "5px", 
          borderBottom: "1px solid #000",
          fontSize: window.innerWidth <= 768 ? "10px" : "12px",
          fontWeight: "bold"
        }}>
          EXTENSION : ENSENADA
        </div>
        <div style={{ 
          textAlign: "center", 
          padding: "5px", 
          borderBottom: "1px solid #000",
          fontSize: window.innerWidth <= 768 ? "10px" : "12px",
          fontWeight: "bold"
        }}>
          {materia}
        </div>
        <div style={{ 
          textAlign: "center", 
          padding: "15px 5px 5px 5px",
          fontSize: window.innerWidth <= 768 ? "8px" : "10px",
          fontWeight: "bold"
        }}>
          ESTUDIANTE DE LICENCIATURA
        </div>
        <div style={{ 
          textAlign: "center", 
          padding: "5px", 
          borderBottom: "1px solid #000",
          fontSize: window.innerWidth <= 768 ? "8px" : "10px",
          fontWeight: "bold",
          marginBottom: "10px"
        }}>
          FECHA DEL CURSO: {fechaCurso}
        </div>

        {/* Tabla que simula el Excel */}
        <div style={{ 
          margin: "10px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch"
        }}>
          <table style={{ 
            width: isMobile ? "800px" : "100%",
            minWidth: isMobile ? "800px" : "auto",
            borderCollapse: "collapse",
            fontSize: isMobile ? "8px" : "9px",
            fontFamily: "Arial, sans-serif"
          }}>
            {/* Encabezados de la tabla */}
            <thead>
              <tr style={{ backgroundColor: "#F2F2F2" }}>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  NO. INDIVIDUAL
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  NOMBRE:
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  APELLIDO:
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  25%<br/>ASISTENCIA
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  25%<br/>TAREA
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  25%<br/>PROYECTO
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  25%<br/>EXAMEN
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  TOTAL
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  NOTA
                </th>
                <th style={{ 
                  border: "1px solid #000", 
                  padding: window.innerWidth <= 768 ? "4px" : "8px", 
                  textAlign: "center", 
                  fontWeight: "bold",
                  fontSize: window.innerWidth <= 768 ? "7px" : "9px"
                }}>
                  OBSERVACION
                </th>
              </tr>
            </thead>
            {/* Cuerpo de la tabla */}
            <tbody>
              {rowData && rowData.map((student, index) => (
                <tr key={index}>
                  <td style={{ 
                    border: "1px solid #000", 
                    padding: window.innerWidth <= 768 ? "2px" : "4px", 
                    textAlign: "center", 
                    backgroundColor: "#DAEEF3" 
                  }}>
                    <input
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: window.innerWidth <= 768 ? "8px" : "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["NO."] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["NO."] = e.target.value;
                        setRowData(newData);
                      }}
                      placeholder="Matrícula"
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["NOMBRE"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["NOMBRE"] = e.target.value;
                        setRowData(newData);
                      }}
                      placeholder="Nombre"
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["APELLIDO"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["APELLIDO"] = e.target.value;
                        setRowData(newData);
                      }}
                      placeholder="Apellido"
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      type="number"
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["25% ASISTENCIA"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["25% ASISTENCIA"] = e.target.value;
                        setRowData(newData);
                      }}
                      min="0"
                      max="25"
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      type="number"
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["25% TAREA"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["25% TAREA"] = e.target.value;
                        setRowData(newData);
                      }}
                      min="0"
                      max="25"
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      type="number"
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["25% PROYECTO"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["25% PROYECTO"] = e.target.value;
                        setRowData(newData);
                      }}
                      min="0"
                      max="25"
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      type="number"
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["25% EXAMEN"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["25% EXAMEN"] = e.target.value;
                        setRowData(newData);
                      }}
                      min="0"
                      max="25"
                    />
                  </td>
                  <td style={{ 
                    border: "1px solid #000", 
                    padding: "4px", 
                    textAlign: "center",
                    fontSize: "9px",
                    backgroundColor: "#DAEEF3"
                  }}>
                    {student["TOTAL"] || "0.00%"}
                  </td>
                  <td style={{ 
                    border: "1px solid #000", 
                    padding: "4px", 
                    textAlign: "center",
                    fontSize: "9px",
                    backgroundColor: "#DAEEF3",
                    fontWeight: "bold"
                  }}>
                    {student["NOTA"] || ""}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", backgroundColor: "#DAEEF3" }}>
                    <input
                      style={{ 
                        border: "none", 
                        width: "100%", 
                        textAlign: "center",
                        fontSize: "9px",
                        backgroundColor: "#DAEEF3"
                      }}
                      value={student["OBSERVACION"] || ""}
                      onChange={(e) => {
                        const newData = [...rowData];
                        newData[index]["OBSERVACION"] = e.target.value;
                        setRowData(newData);
                      }}
                      placeholder="Observaciones"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel de controles responsive */}
      <div style={{ 
        position: window.innerWidth > 768 ? "fixed" : "relative", 
        top: window.innerWidth > 768 ? "20px" : "auto", 
        right: window.innerWidth > 768 ? "20px" : "auto", 
        width: window.innerWidth > 768 ? "300px" : "100%", 
        backgroundColor: "#f8f9fa", 
        border: "1px solid #ddd", 
        borderRadius: "5px", 
        padding: "15px",
        maxHeight: window.innerWidth > 768 ? "90vh" : "auto",
        overflowY: window.innerWidth > 768 ? "auto" : "visible",
        marginTop: window.innerWidth <= 768 ? "20px" : "0"
      }}> 
        <h3 style={{ fontSize: window.innerWidth <= 768 ? "16px" : "18px" }}>🎓 Sistema de Calificaciones</h3>
        <p style={{ 
          fontSize: window.innerWidth <= 768 ? "10px" : "12px", 
          color: "#666", 
          marginBottom: "15px" 
        }}>
          Instituto Teológico - Universidad Bíblica Harvest
        </p>

        {/* Crear nueva plantilla */}
        <div style={{ marginBottom: 20 }}>
          <h3>📝 Nueva Plantilla</h3>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "12px", display: "block", marginBottom: "3px" }}>Materia:</label>
            <input
              type="text"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Ej: MATERIA PENTATEUCO"
              style={{ width: "100%", padding: "3px", marginBottom: "5px", fontSize: "12px" }}
            />
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "12px", display: "block", marginBottom: "3px" }}>Fecha del Curso:</label>
            <input
              type="text"
              value={fechaCurso}
              onChange={(e) => setFechaCurso(e.target.value)}
              placeholder="Ej: MARZO A ABRIL 2024"
              style={{ width: "100%", padding: "3px", marginBottom: "5px", fontSize: "12px" }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "12px" }}>Estudiantes:</label>
            <input
              type="number"
              value={studentsCount}
              onChange={(e) => setStudentsCount(parseInt(e.target.value) || 0)}
              placeholder="30"
              style={{ width: "60px", padding: "3px", fontSize: "12px" }}
              min="1"
              max="100"
            />
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "12px", display: "block", marginBottom: "3px" }}>
              📁 Nombre del archivo (sin extensión):
            </label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={`Calificaciones_${materia.replace(/\s+/g, '_')}_${fechaCurso.replace(/\s+/g, '_')}`}
                style={{ flex: 1, padding: "3px", fontSize: "12px" }}
              />
              <button
                onClick={() => {
                  const suggested = `Calificaciones_${materia.replace(/[^a-zA-Z0-9]/g, '_')}_${fechaCurso.replace(/[^a-zA-Z0-9]/g, '_')}`;
                  setFileName(suggested);
                }}
                style={{ 
                  padding: "3px 6px", 
                  fontSize: "10px", 
                  backgroundColor: "#6c757d", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                title="Generar nombre automático"
              >
                🎯
              </button>
            </div>
            <small style={{ fontSize: "10px", color: "#666" }}>
              💡 Se guardará como: <strong>{(fileName.trim() || 'calificaciones').replace(/[<>:"/\\|?*]/g, '_')}.xlsx</strong>
            </small>
          </div>
          
          <button
            onClick={createNewTemplate}
            disabled={loading || studentsCount === 0}
            style={{
              width: "100%",
              padding: 8,
              fontSize: "12px",
              backgroundColor: studentsCount > 0 ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 3,
              cursor: studentsCount > 0 ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Creando..." : "🆕 Crear Plantilla"}
          </button>
        </div>

        {/* Herramientas de calificación */}
        <div style={{ marginBottom: 15 }}>
          <h3>⚡ Herramientas</h3>
          <button
            onClick={calculateTotals}
            disabled={loading || !rowData || rowData.length === 0}
            style={{
              width: "100%",
              padding: 6,
              fontSize: "11px",
              backgroundColor: rowData && rowData.length > 0 ? "#17a2b8" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 3,
              cursor: rowData && rowData.length > 0 ? "pointer" : "not-allowed",
              marginBottom: 5,
            }}
          >
            {loading ? "Calculando..." : "🧮 Calcular Totales"}
          </button>
          
          <button
            onClick={saveGrades}
            disabled={loading || !rowData || rowData.length === 0}
            style={{
              width: "100%",
              padding: 6,
              fontSize: "11px",
              backgroundColor: rowData && rowData.length > 0 ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 3,
              cursor: rowData && rowData.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Guardando..." : "💾 Guardar Calificaciones"}
          </button>
        </div>

        {/* Información del archivo actual */}
        <div style={{ marginTop: 15, padding: 8, backgroundColor: "#f8f9fa", borderRadius: 3 }}>
          <small>
            <strong>Archivo:</strong> {currentFile || "Ninguno"}<br/>
            <strong>Estudiantes:</strong> {rowData ? rowData.length : 0}<br/>
            <strong>Columnas:</strong> {columnDefs ? columnDefs.length : 0}
          </small>
        </div>

        {/* Ayuda rápida */}
        <div style={{ marginTop: 20, padding: 10, backgroundColor: "#e3f2fd", borderRadius: 5 }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>💡 Ayuda Rápida</h4>
          <ul style={{ margin: 0, padding: "0 0 0 15px", fontSize: "12px" }}>
            <li>Haz clic en cualquier celda para editarla</li>
            <li>Las calificaciones se guardan automáticamente</li>
            <li>Usa "Calcular Totales" para promedios automáticos</li>
            <li>Descarga el archivo final cuando termines</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
