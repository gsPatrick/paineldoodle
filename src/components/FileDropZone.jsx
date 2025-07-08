import React, { useRef, useState } from "react"

const FileDropZone = ({ accept, multiple = false, onDrop, maxFiles = 10, children, tipo = "imagem" }) => {
    const inputRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFiles = (files) => {
        if (files && files.length > 0) {
            // Limitar o número de arquivos
            const selectedFiles = Array.from(files).slice(0, maxFiles);
            onDrop(selectedFiles);
        }
    }

    const handleChange = (e) => {
        handleFiles(e.target.files)
    }

    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.click()
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
    }

    // Personalizar mensagens de acordo com o tipo
    const renderMessage = () => {
        if (tipo === "imagem") {
            return (
                <>
                    <p>Clique ou arraste imagens aqui</p>
                    <p className="text-sm">Formatos aceitos: JPG, PNG, GIF, WebP</p>
                </>
            )
        } else if (tipo === "arquivo") {
            return (
                <>
                    <p>Clique ou arraste arquivo digital aqui</p>
                    <p className="text-sm">Formatos aceitos: PDF, ZIP</p>
                </>
            )
        } else if (tipo === "video") {
            return (
                <>
                    <p>Clique ou arraste vídeo aqui</p>
                    <p className="text-sm">Formatos aceitos: MP4, WebM, AVI, MOV</p>
                </>
            )
        } else {
            return (
                <>
                    <p>Clique ou arraste arquivos aqui</p>
                    <p className="text-sm">Selecione os arquivos para upload</p>
                </>
            )
        }
    }

    return (
        <div
            className={`border-dashed border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} p-4 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleChange}
            />
            {children ? children : (
                <div className="text-gray-500">
                    {renderMessage()}
                </div>
            )}
        </div>
    )
}

export default FileDropZone 