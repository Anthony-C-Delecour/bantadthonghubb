import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Camera, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PolaroidModeProps {
  onClose?: () => void;
}

export function PolaroidMode({ onClose }: PolaroidModeProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [polaroidImage, setPolaroidImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setPolaroidImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const createPolaroid = async () => {
    if (!uploadedImage || !canvasRef.current) return;

    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Polaroid dimensions
      const polaroidWidth = 400;
      const borderSize = 30;
      const bottomBorder = 100;
      const imageSize = polaroidWidth - borderSize * 2;

      // Calculate aspect ratio for square crop
      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;

      canvas.width = polaroidWidth;
      canvas.height = polaroidWidth + bottomBorder - borderSize;

      // White background (Polaroid frame)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle shadow effect
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;

      // Draw the image (cropped to square)
      ctx.drawImage(
        img,
        offsetX,
        offsetY,
        size,
        size,
        borderSize,
        borderSize,
        imageSize,
        imageSize
      );

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Add vintage filter effect
      const imageData = ctx.getImageData(borderSize, borderSize, imageSize, imageSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Slight sepia/warm tone
        data[i] = Math.min(255, data[i] * 1.05); // Red
        data[i + 1] = data[i + 1] * 0.95; // Green
        data[i + 2] = data[i + 2] * 0.85; // Blue
        // Slight desaturation
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i] * 0.8 + avg * 0.2;
        data[i + 1] = data[i + 1] * 0.8 + avg * 0.2;
        data[i + 2] = data[i + 2] * 0.8 + avg * 0.2;
      }

      ctx.putImageData(imageData, borderSize, borderSize);

      // Add caption at the bottom
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 14px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "#MakeBanTadThongGreatAgain",
        polaroidWidth / 2,
        imageSize + borderSize + 50
      );

      // Add date
      ctx.font = "12px 'DM Sans', sans-serif";
      ctx.fillStyle = "#666666";
      const date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      ctx.fillText(date, polaroidWidth / 2, imageSize + borderSize + 75);

      // Get the final image
      setPolaroidImage(canvas.toDataURL("image/png"));
      setIsProcessing(false);

      toast({
        title: "Polaroid created! 📸",
        description: "Your photo has been transformed into a polaroid.",
      });
    };

    img.src = uploadedImage;
  };

  const downloadPolaroid = () => {
    if (!polaroidImage) return;

    const link = document.createElement("a");
    link.download = `bantadthong-polaroid-${Date.now()}.png`;
    link.href = polaroidImage;
    link.click();

    toast({
      title: "Downloaded!",
      description: "Your polaroid has been saved.",
    });
  };

  const resetPolaroid = () => {
    setUploadedImage(null);
    setPolaroidImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Polaroid Mode 📸</h2>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Transform your Bantadthong memories into vintage polaroids
      </p>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload Area */}
      {!uploadedImage && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full aspect-square max-w-xs",
            "border-2 border-dashed border-border rounded-2xl",
            "flex flex-col items-center justify-center gap-4",
            "cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all",
            "bg-card"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">Upload a photo</p>
            <p className="text-sm text-muted-foreground">Click or drag and drop</p>
          </div>
        </div>
      )}

      {/* Preview Area */}
      {uploadedImage && !polaroidImage && (
        <div className="w-full max-w-xs">
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full aspect-square object-cover rounded-xl"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={resetPolaroid}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={createPolaroid}
            disabled={isProcessing}
            className="w-full mt-4"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Create Polaroid
              </>
            )}
          </Button>
        </div>
      )}

      {/* Polaroid Result */}
      {polaroidImage && (
        <div className="w-full max-w-xs">
          <div className="relative polaroid-shadow">
            <img
              src={polaroidImage}
              alt="Polaroid"
              className="w-full rounded-sm"
              style={{
                transform: "rotate(-2deg)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={downloadPolaroid} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={resetPolaroid}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State Polaroid Frame */}
      {!uploadedImage && (
        <div className="mt-8 opacity-50">
          <div
            className="bg-white p-4 pb-16 rounded-sm shadow-lg"
            style={{ transform: "rotate(3deg)" }}
          >
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-4xl">📷</span>
            </div>
            <p className="text-center mt-6 text-xs text-gray-500 font-medium">
              #MakeBanTadThongGreatAgain
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
