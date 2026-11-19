'use client'

import React, { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { PenTool, Upload, ShieldCheck, Check, Trash2, Loader2 } from 'lucide-react'
import apiClient from '@/lib/api/client'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
  onSigned: (signatureData: any) => void
}

export function SignatureModal({ isOpen, onClose, reportId, onSigned }: SignatureModalProps) {
  const sigCanvasRef = useRef<any>(null)
  const [signerName, setSignerName] = useState('Dr. Jane Smith')
  const [signerRole, setSignerRole] = useState('Lead ISO Auditor')
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)

  const clearCanvas = () => {
    sigCanvasRef.current?.clear()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleApplySignature = async () => {
    if (!signerName.trim() || !signerRole.trim()) {
      toast.error('Please enter signer name and role')
      return
    }

    let signatureBase64 = ''

    if (activeTab === 'draw') {
      if (sigCanvasRef.current?.isEmpty()) {
        toast.error('Please draw your signature')
        return
      }
      signatureBase64 = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png') || ''
    } else {
      if (!uploadedImage) {
        toast.error('Please select a signature image file')
        return
      }
      signatureBase64 = uploadedImage
    }

    setIsSigning(true)
    try {
      toast.info('Calculating SHA-256 digest & stamping digital signature into PDF...')
      const res = await apiClient.post(`/api/reports/${reportId}/sign`, {
        signer_name: signerName,
        signer_role: signerRole,
        signature_type: activeTab === 'draw' ? 'drawn' : 'uploaded',
        signature_image: signatureBase64,
      })
      toast.success('Report successfully cryptographically signed!')
      onSigned(res.data)
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to sign report')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white p-6 rounded-xl border border-slate-200 shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Digital Signature & Final Authorization
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Applying your signature calculates the final SHA-256 document checksum and locks the audit report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="signer-name" className="text-xs font-medium text-slate-700">
                Auditor Full Name
              </Label>
              <Input
                id="signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="signer-role" className="text-xs font-medium text-slate-700">
                Auditor Role / Title
              </Label>
              <Input
                id="signer-role"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                placeholder="e.g. Lead Technical Auditor"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 mb-2">
              <TabsTrigger value="draw" className="text-xs flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" /> Draw Signature
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-2">
              <div className="border border-slate-300 rounded-lg bg-slate-50 overflow-hidden relative">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#0f172a"
                  canvasProps={{
                    className: 'w-full h-40 cursor-crosshair bg-white',
                  }}
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 bg-white/90 p-1.5 rounded border border-slate-200 transition-colors"
                  title="Clear signature"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic text-center">
                Sign directly using mouse or touchscreen above
              </p>
            </TabsContent>

            <TabsContent value="upload" className="space-y-2">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50">
                {uploadedImage ? (
                  <div className="space-y-2">
                    <img src={uploadedImage} alt="Signature Preview" className="max-h-24 mx-auto object-contain" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                      className="text-xs text-rose-600 hover:text-rose-700 h-6"
                    >
                      Clear image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <label className="cursor-pointer">
                      <span className="text-xs font-semibold text-blue-600 hover:underline">
                        Choose PNG or JPG file
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Recommended: Transparent background PNG</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Legal Notice:</strong> Signing this ISO compliance report creates a permanent, tamper-evident cryptographic signature. The finalized report version will be immutably locked.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSigning} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApplySignature}
            disabled={isSigning}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
          >
            {isSigning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Sign & Finalize
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
