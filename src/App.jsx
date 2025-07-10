import { useState } from "react";
import Navbar from "./Component/Navbar";

export default function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  // State baru untuk menyimpan nama file PDF
  const [fileName, setFileName] = useState("converted-images");

  const processFiles = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      console.log("Tidak ada file gambar yang valid.");
      return;
    }

    const imagePromises = imageFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file,
            name: file.name,
            url: e.target.result,
            id: Math.random().toString(36).substr(2, 9),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setSelectedImages((prev) => [...prev, ...images]);
    });
  };

  const handleImageSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    event.target.value = null;
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeImage = (id) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Fungsi untuk drag & drop reorder
  const handleDragStart = (e, imageId) => {
    setDraggedItemId(imageId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeaveItem = () => {
    setDragOverIndex(null);
  };

  const handleDropItem = (e, dropIndex) => {
    e.preventDefault();
    const draggedIndex = selectedImages.findIndex(
      (img) => img.id === draggedItemId
    );

    if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
      const newImages = [...selectedImages];
      const draggedItem = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, draggedItem);
      setSelectedImages(newImages);
    }

    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const convertToPDF = async () => {
    if (selectedImages.length === 0) {
      console.log("Pilih gambar terlebih dahulu!");
      return;
    }

    setIsConverting(true);

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        if (i > 0) {
          pdf.addPage();
        }

        const image = new Image();
        image.src = img.url;

        await new Promise((resolve) => {
          image.onload = () => {
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const maxWidth = pdfWidth - margin * 2;
            const maxHeight = pdfHeight - margin * 2;

            let { width, height } = image;
            let ratio = width / height;

            if (width > maxWidth) {
              width = maxWidth;
              height = width / ratio;
            }

            if (height > maxHeight) {
              height = maxHeight;
              width = height * ratio;
            }

            const x = (pdfWidth - width) / 2;
            const y = (pdfHeight - height) / 2;

            pdf.addImage(img.url, "JPEG", x, y, width, height);
            resolve();
          };
        });
      }

      const finalFileName =
        fileName.trim() === "" ? "converted-images" : fileName;
      pdf.save(`${finalFileName}.pdf`);
    } catch (error) {
      console.error("Error converting to PDF:", error);
    } finally {
      setIsConverting(false);
    }
  };

  const clearAll = () => {
    setSelectedImages([]);
    // Reset juga nama file ke default
    setFileName("converted-images");
  };

  return (
    <div
      className={`min-h-screen pb-32 transition-all duration-500 ${
        selectedImages.length > 0
          ? "bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      <input
        type="file"
        id="imageInput"
        multiple
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              JPG to PDF Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              Convert multiple images into a single PDF file quickly and easily.
            </p>
            <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>FREE & Unlimited Conversions</span>
              </div>
            </div>
          </div>

          {/* --- BAGIAN 1: INPUT GAMBAR (Selalu Terlihat) --- */}
          <label
            htmlFor="imageInput"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group cursor-pointer bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-dashed p-12 text-center flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
              isDragging
                ? "border-blue-500 bg-blue-50/80 shadow-blue-200/50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragging
                  ? "bg-blue-500 scale-110"
                  : "bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200"
              }`}
            >
              <svg
                className={`w-10 h-10 transition-all duration-300 ${
                  isDragging ? "text-white" : "text-blue-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="mt-6">
              <p
                className={`text-xl font-semibold transition-colors ${
                  isDragging ? "text-blue-700" : "text-gray-900"
                }`}
              >
                {isDragging ? "Drop file here" : "Click or Drag & Drop Images"}
              </p>
              <p className="text-gray-500 mt-2">Support: JPG, JPEG, PNG</p>
            </div>
          </label>

          {/* --- BAGIAN 2: OUTPUT / PRATINJAU GAMBAR (Hanya terlihat jika ada gambar) --- */}
          {selectedImages.length > 0 && (
            <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    Selected Images
                  </h3>
                  <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {selectedImages.length} file
                  </div>
                </div>
                <button
                  onClick={clearAll}
                  className="text-red-500 hover:text-red-700 font-medium text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Clear All</span>
                </button>
              </div>

              {/* Instruksi untuk drag & drop */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Tip:</span>
                  <span>Click and drag images to reorder them.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
                {selectedImages.map((img, index) => (
                  <div
                    key={img.id}
                    className={`relative group cursor-move transition-all duration-200 ${
                      dragOverIndex === index ? "scale-105 z-10" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, img.id)}
                    onDragOver={(e) => handleDragOverItem(e, index)}
                    onDragLeave={handleDragLeaveItem}
                    onDrop={(e) => handleDropItem(e, index)}
                  >
                    {/* Remove button - moved outside of image */}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-20 border-2 border-white"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg bg-white">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>

                      {/* Drag indicator */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </div>
                      </div>

                      {/* Image number */}
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                        {index + 1}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-2 truncate font-medium px-1">
                      {img.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* --- OPSI DAN TOMBOL KONVERSI --- */}
              <div className="pt-6 border-t border-gray-200 space-y-6">
                {/* Input untuk nama file */}
                <div className="space-y-2">
                  <label
                    htmlFor="fileName"
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700"
                  >
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>PDF Filename</span>
                  </label>
                  <div className="relative">
                    <div className="flex rounded-xl shadow-sm overflow-hidden border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <div className="flex items-center pl-4 bg-gradient-to-r from-gray-50 to-white">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="fileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="flex-1 block w-full h-12 px-4 border-0 bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none text-sm font-medium"
                        placeholder="Example: my-task"
                      />
                      <div className="flex items-center px-4 bg-gradient-to-l from-blue-50 to-white border-l border-gray-200">
                        <span className="text-sm font-semibold text-blue-600 select-none">
                          .pdf
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Konversi */}
                <button
                  onClick={convertToPDF}
                  disabled={isConverting}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {isConverting ? (
                    <>
                      <svg
                        className="animate-spin w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Convert PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>Start to Converted</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Navbar
        imageCount={selectedImages.length}
        onConvertClick={convertToPDF}
        isConverting={isConverting}
        className="fixed bottom-4 inset-x-0 max-w-sm mx-auto"
      />
    </div>
  );
}
