export function getCaretPosition({ element }: { element: Element }) {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return 0

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    return preCaretRange.toString().length
}

export function setCaretPosition({
    element,
    position,
}: {
    element: Element
    position: number
}) {
    let nodeStack: Node[] = Array.from(element.childNodes)
    let charCount = 0
    let targetNode: Node | null = null
    let targetOffset = 0

    while (nodeStack.length > 0) {
        const node = nodeStack.shift()
        if (node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length ?? 0
                if (charCount + textLength >= position) {
                    targetNode = node
                    targetOffset = position - charCount
                    break
                }
                charCount += textLength
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                nodeStack = [...Array.from(node.childNodes), ...nodeStack]
            }
        }
    }

    if (targetNode && targetNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange()
        range.setStart(
            targetNode,
            Math.min(targetOffset, targetNode.textContent?.length ?? 0),
        )
        range.collapse(true)

        const selection = window.getSelection()
        if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }
}
