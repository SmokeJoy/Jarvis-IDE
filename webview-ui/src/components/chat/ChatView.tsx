import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { VSCodeButton, VSCodeLink, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import debounce from "debounce"
import { useDeepCompareEffect, useEvent, useMount } from "react-use"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import styled from "styled-components"
import {
	JarvisIdeApiReqInfo,
	JarvisIdeAsk,
	JarvisIdeMessage,
	JarvisIdeSayBrowserAction,
	JarvisIdeSayTool,
} from "../../../../src/shared/WebviewMessage"
import { findLast } from "../../../src/shared/array"
import { combineApiRequests } from "../../../src/shared/combineApiRequests"
import { combineCommandSequences } from "../../../src/shared/combineCommandSequences"
import { getApiMetrics } from "../../../src/shared/getApiMetrics"
import { useExtensionState } from "../context/ExtensionStateContext"
import { vscode } from "../utils/vscode"
import HistoryPreview from "../history/HistoryPreview"
import Announcement from "./Announcement"
import AutoApproveMenu from "./AutoApproveMenu"
import BrowserSessionRow from "./BrowserSessionRow"
import ChatRow from "./ChatRow"
import ChatTextArea from "./ChatTextArea"
import { TaskHeader } from "./TaskHeader"
import TelemetryBanner from "../common/TelemetryBanner"
import { ApiConfiguration, WebviewMessage } from "../../../src/types/extension"
import { ChatMessage } from "../../../src/shared/types"

// Aggiungo i controlli per la chat history
const HistoryControls = styled.div`
	display: flex;
	gap: 8px;
	margin-bottom: 16px;
	justify-content: flex-end;
`

interface ChatViewProps {
	apiConfiguration: ApiConfiguration
	isHidden?: boolean
	showAnnouncement?: boolean
	hideAnnouncement: () => void
	showHistoryView: () => void
	isEnabled: boolean
}

export const MAX_IMAGES_PER_MESSAGE = 20 // Anthropic limits to 20 images

export const ChatView: React.FC<ChatViewProps> = ({
	apiConfiguration,
	isHidden,
	showAnnouncement,
	hideAnnouncement,
	showHistoryView,
	isEnabled,
}) => {
	const { version, jarvisIdeMessages: messages, taskHistory, telemetrySetting, selectedTask, selectedModelInfo: modelInfo, setMessages } = useExtensionState()
	const [currentStreamingMessage, setCurrentStreamingMessage] = useState<JarvisIdeMessage | null>(null)
	const [isStreaming, setIsStreaming] = useState(false)

	// Carico la chat history all'avvio
	useEffect(() => {
		vscode.postMessage({ 
			type: "loadChatHistory",
			payload: null
		} as WebviewMessage)
	}, [])

	// Gestisco il salvataggio dei messaggi
	useEffect(() => {
		if (currentStreamingMessage) {
			vscode.postMessage({ 
				type: "saveChatMessage", 
				payload: {
					message: {
						...currentStreamingMessage,
						streaming: true
					}
				}
			} as WebviewMessage)
		} else if (messages.length > 0) {
			const lastMsg = messages[messages.length - 1]
			vscode.postMessage({
				type: "saveChatMessage",
				payload: {
					message: {
						...lastMsg,
						streaming: false
					}
				}
			} as WebviewMessage)
		}
	}, [currentStreamingMessage, messages])

	const task = useMemo(() => messages.at(0), [messages])
	const modifiedMessages = useMemo(() => messages.slice(1), [messages])
	const apiMetrics = useMemo(() => getApiMetrics(modifiedMessages), [modifiedMessages])

	const lastApiReqTotalTokens = useMemo(() => {
		const getTotalTokensFromApiReqMessage = (msg: JarvisIdeMessage) => {
			if (!msg.text) return 0
			const { tokensIn, tokensOut, cacheWrites, cacheReads }: JarvisIdeApiReqInfo = JSON.parse(msg.text)
			return (tokensIn || 0) + (tokensOut || 0) + (cacheWrites || 0) + (cacheReads || 0)
		}
		const lastApiReqMessage = findLast(modifiedMessages, (msg) => {
			if (msg.say !== "api_req_started") return false
			return getTotalTokensFromApiReqMessage(msg) > 0
		})
		if (!lastApiReqMessage) return undefined
		return getTotalTokensFromApiReqMessage(lastApiReqMessage)
	}, [modifiedMessages])

	const [inputValue, setInputValue] = useState("")
	const textAreaRef = useRef<HTMLTextAreaElement>(null)
	const [textAreaDisabled, setTextAreaDisabled] = useState(false)
	const [selectedImages, setSelectedImages] = useState<string[]>([])

	const [jarvisIdeAsk, setJarvisIdeAsk] = useState<JarvisIdeAsk | undefined>(undefined)
	const [enableButtons, setEnableButtons] = useState<boolean>(false)
	const [primaryButtonText, setPrimaryButtonText] = useState<string | undefined>("Approve")
	const [secondaryButtonText, setSecondaryButtonText] = useState<string | undefined>("Reject")
	const [didClickCancel, setDidClickCancel] = useState(false)
	const virtuosoRef = useRef<VirtuosoHandle>(null)
	const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const disableAutoScrollRef = useRef(false)
	const [showScrollToBottom, setShowScrollToBottom] = useState(false)
	const [isAtBottom, setIsAtBottom] = useState(false)

	const lastMessage = useMemo(() => messages.at(-1), [messages])
	const secondLastMessage = useMemo(() => messages.at(-2), [messages])
	useDeepCompareEffect(() => {
		if (lastMessage) {
			switch (lastMessage.type) {
				case "ask":
					const isPartial = lastMessage.partial === true
					switch (lastMessage.ask) {
						case "api_req_failed":
							setTextAreaDisabled(true)
							setJarvisIdeAsk("api_req_failed")
							setEnableButtons(true)
							setPrimaryButtonText("Retry")
							setSecondaryButtonText("Start New Task")
							break
						case "mistake_limit_reached":
							setTextAreaDisabled(false)
							setJarvisIdeAsk("mistake_limit_reached")
							setEnableButtons(true)
							setPrimaryButtonText("Proceed Anyways")
							setSecondaryButtonText("Start New Task")
							break
						case "auto_approval_max_req_reached":
							setTextAreaDisabled(true)
							setJarvisIdeAsk("auto_approval_max_req_reached")
							setEnableButtons(true)
							setPrimaryButtonText("Proceed")
							setSecondaryButtonText("Start New Task")
							break
						case "followup":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("followup")
							setEnableButtons(false)
							break
						case "plan_mode_respond":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("plan_mode_respond")
							setEnableButtons(false)
							break
						case "tool":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("tool")
							setEnableButtons(!isPartial)
							const tool = JSON.parse(lastMessage.text || "{}") as JarvisIdeSayTool
							switch (tool.tool) {
								case "editedExistingFile":
								case "newFileCreated":
									setPrimaryButtonText("Save")
									setSecondaryButtonText("Reject")
									break
								default:
									setPrimaryButtonText("Approve")
									setSecondaryButtonText("Reject")
									break
							}
							break
						case "browser_action_launch":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("browser_action_launch")
							setEnableButtons(!isPartial)
							setPrimaryButtonText("Approve")
							setSecondaryButtonText("Reject")
							break
						case "command":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("command")
							setEnableButtons(!isPartial)
							setPrimaryButtonText("Run Command")
							setSecondaryButtonText("Reject")
							break
						case "command_output":
							setTextAreaDisabled(false)
							setJarvisIdeAsk("command_output")
							setEnableButtons(true)
							setPrimaryButtonText("Proceed While Running")
							setSecondaryButtonText(undefined)
							break
						case "use_mcp_server":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("use_mcp_server")
							setEnableButtons(!isPartial)
							setPrimaryButtonText("Approve")
							setSecondaryButtonText("Reject")
							break
						case "completion_result":
							setTextAreaDisabled(isPartial)
							setJarvisIdeAsk("completion_result")
							setEnableButtons(!isPartial)
							setPrimaryButtonText("Start New Task")
							setSecondaryButtonText(undefined)
							break
						case "resume_task":
							setTextAreaDisabled(false)
							setJarvisIdeAsk("resume_task")
							setEnableButtons(true)
							setPrimaryButtonText("Resume Task")
							setSecondaryButtonText(undefined)
							setDidClickCancel(false)
							break
						case "resume_completed_task":
							setTextAreaDisabled(false)
							setJarvisIdeAsk("resume_completed_task")
							setEnableButtons(true)
							setPrimaryButtonText("Start New Task")
							setSecondaryButtonText(undefined)
							setDidClickCancel(false)
							break
					}
					break
				case "say":
					switch (lastMessage.say) {
						case "api_req_started":
							if (secondLastMessage?.ask === "command_output") {
								setInputValue("")
								setTextAreaDisabled(true)
								setSelectedImages([])
								setJarvisIdeAsk(undefined)
								setEnableButtons(false)
							}
							break
						case "task":
						case "error":
						case "api_req_finished":
						case "text":
						case "browser_action":
						case "browser_action_result":
						case "browser_action_launch":
						case "command":
						case "use_mcp_server":
						case "command_output":
						case "mcp_server_request_started":
						case "mcp_server_response":
						case "completion_result":
						case "tool":
							setInputValue("")
							setTextAreaDisabled(false)
							setSelectedImages([])
							setJarvisIdeAsk(undefined)
							setEnableButtons(false)
							break
					}
					break
			}
		}
	}, [lastMessage, secondLastMessage])

	useEffect(() => {
		if (messages.length === 0) {
			setTextAreaDisabled(false)
			setJarvisIdeAsk(undefined)
			setEnableButtons(false)
			setPrimaryButtonText("Approve")
			setSecondaryButtonText("Reject")
		}
	}, [messages.length])

	useEffect(() => {
		setExpandedRows({})
	}, [task?.ts])

	const isStreaming = useMemo(() => {
		const isLastAsk = !!modifiedMessages.at(-1)?.ask
		const isToolCurrentlyAsking = isLastAsk && jarvisIdeAsk !== undefined && enableButtons && primaryButtonText !== undefined
		if (isToolCurrentlyAsking) {
			return false
		}

		const isLastMessagePartial = modifiedMessages.at(-1)?.partial === true
		if (isLastMessagePartial) {
			return true
		} else {
			const lastApiReqStarted = findLast(modifiedMessages, (message) => message.say === "api_req_started")
			if (lastApiReqStarted && lastApiReqStarted.text != null && lastApiReqStarted.say === "api_req_started") {
				const cost = JSON.parse(lastApiReqStarted.text).cost
				if (cost === undefined) {
					return true
				}
			}
		}

		return false
	}, [modifiedMessages, jarvisIdeAsk, enableButtons, primaryButtonText])

	const handleSendMessage = useCallback(
		(inputValue: string, selectedImages: string[]) => {
			if (!inputValue && (!selectedImages || selectedImages.length === 0) && !jarvisIdeAsk) return
			if (isStreaming) return
			if (textAreaDisabled) return

			vscode.postMessage({
				type: "sendPrompt",
				payload: {
					prompt: inputValue || "",
					imageUris: selectedImages
				}
			} as WebviewMessage)

			setInputValue("")
			setSelectedImages([])
			setIsStreaming(true)
			setEnableButtons(false)
		},
		[isStreaming, textAreaDisabled, jarvisIdeAsk]
	)

	const handlePrimaryButtonClick = useCallback(() => {
		if (didClickCancel) {
			return
		}
		if (!jarvisIdeAsk) {
			return
		}

		if (jarvisIdeAsk === "tool") {
			vscode.postMessage({
				type: "acceptTool",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "browser_action_launch") {
			vscode.postMessage({
				type: "acceptBrowserAction",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "command") {
			vscode.postMessage({
				type: "acceptCommand",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "command_output") {
			vscode.postMessage({
				type: "continueCommandOutput",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "api_req_failed") {
			vscode.postMessage({
				type: "retry",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "mistake_limit_reached") {
			vscode.postMessage({
				type: "mistakeProceed",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "completion_result") {
			vscode.postMessage({
				type: "newTask",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "auto_approval_max_req_reached") {
			vscode.postMessage({
				type: "autoApprovalMaxReqProceed",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "use_mcp_server") {
			vscode.postMessage({
				type: "useMcpServer",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "resume_task") {
			vscode.postMessage({
				type: "resumeTask",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		} else if (jarvisIdeAsk === "resume_completed_task") {
			vscode.postMessage({
				type: "newTask",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
		}
	}, [jarvisIdeAsk, didClickCancel])

	const handleRejectButtonClick = useCallback(() => {
		if (didClickCancel) return
		if (!jarvisIdeAsk) return

		if (jarvisIdeAsk === "tool") {
			vscode.postMessage({
				type: "rejectTool",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
			setDidClickCancel(true)
		} else if (jarvisIdeAsk === "browser_action_launch") {
			vscode.postMessage({
				type: "rejectBrowserAction",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
			setDidClickCancel(true)
		} else if (jarvisIdeAsk === "command") {
			vscode.postMessage({
				type: "rejectCommand",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
			setDidClickCancel(true)
		} else if (jarvisIdeAsk === "api_req_failed" || jarvisIdeAsk === "mistake_limit_reached" || jarvisIdeAsk === "auto_approval_max_req_reached") {
			vscode.postMessage({
				type: "newTask",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
			setDidClickCancel(true)
		} else if (jarvisIdeAsk === "use_mcp_server") {
			vscode.postMessage({
				type: "rejectUseMcpServer",
				payload: {
					ask: jarvisIdeAsk
				}
			} as WebviewMessage)
			setDidClickCancel(true)
		}
	}, [jarvisIdeAsk, didClickCancel])

	const handleCancelStreamingClick = useCallback(() => {
		vscode.postMessage({
			type: "cancelStreaming",
			payload: {}
		} as WebviewMessage)
	}, [])

	const handleExportChat = useCallback(() => {
		vscode.postMessage({
			type: "exportChat",
			payload: {}
		} as WebviewMessage)
	}, [])

	useMount(() => {
		textAreaRef.current?.focus()
	})

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!isHidden && !textAreaDisabled && !enableButtons) {
				textAreaRef.current?.focus()
			}
		}, 50)
		return () => {
			clearTimeout(timer)
		}
	}, [isHidden, textAreaDisabled, enableButtons])

	const visibleMessages = useMemo(() => {
		return modifiedMessages.filter((message) => {
			switch (message.ask) {
				case "completion_result":
					if (message.text === "") {
						return false
					}
					break
				case "api_req_failed":
				case "resume_task":
				case "resume_completed_task":
					return false
			}
			switch (message.say) {
				case "api_req_finished":
				case "api_req_retried":
				case "deleted_api_reqs":
					return false
				case "text":
					if ((message.text ?? "") === "" && (message.images?.length ?? 0) === 0) {
						return false
					}
					break
				case "mcp_server_request_started":
					return false
			}
			return true
		})
	}, [modifiedMessages])

	const isBrowserSessionMessage = (message: JarvisIdeMessage): boolean => {
		if (message.type === "ask") {
			return ["browser_action_launch"].includes(message.ask!)
		}
		if (message.type === "say") {
			return ["browser_action_launch", "api_req_started", "text", "browser_action", "browser_action_result"].includes(
				message.say!,
			)
		}
		return false
	}

	const groupedMessages = useMemo(() => {
		const result: (JarvisIdeMessage | JarvisIdeMessage[])[] = []
		let currentGroup: JarvisIdeMessage[] = []
		let isInBrowserSession = false

		const endBrowserSession = () => {
			if (currentGroup.length > 0) {
				result.push([...currentGroup])
				currentGroup = []
				isInBrowserSession = false
			}
		}

		visibleMessages.forEach((message) => {
			if (message.ask === "browser_action_launch" || message.say === "browser_action_launch") {
				endBrowserSession()
				isInBrowserSession = true
				currentGroup.push(message)
			} else if (isInBrowserSession) {
				if (message.say === "api_req_started") {
					const lastApiReqStarted = [...currentGroup].reverse().find((m) => m.say === "api_req_started")
					if (lastApiReqStarted?.text != null) {
						const info = JSON.parse(lastApiReqStarted.text)
						const isCancelled = info.cancelReason != null
						if (isCancelled) {
							endBrowserSession()
							result.push(message)
							return
						}
					}
				}

				if (isBrowserSessionMessage(message)) {
					currentGroup.push(message)

					if (message.say === "browser_action") {
						const browserAction = JSON.parse(message.text || "{}") as JarvisIdeSayBrowserAction
						if (browserAction.action === "close") {
							endBrowserSession()
						}
					}
				} else {
					endBrowserSession()
					result.push(message)
				}
			} else {
				result.push(message)
			}
		})

		if (currentGroup.length > 0) {
			result.push([...currentGroup])
		}

		return result
	}, [visibleMessages])

	const scrollToBottomSmooth = useMemo(
		() =>
			debounce(
				() => {
					virtuosoRef.current?.scrollTo({
						top: Number.MAX_SAFE_INTEGER,
						behavior: "smooth",
					})
				},
				10,
				{ immediate: true },
			),
		[],
	)

	const scrollToBottomAuto = useCallback(() => {
		virtuosoRef.current?.scrollTo({
			top: Number.MAX_SAFE_INTEGER,
			behavior: "auto",
		})
	}, [])

	const toggleRowExpansion = useCallback(
		(ts: number) => {
			const isCollapsing = expandedRows[ts] ?? false
			const lastGroup = groupedMessages.at(-1)
			const isLast = Array.isArray(lastGroup) ? lastGroup[0].ts === ts : lastGroup?.ts === ts
			const secondToLastGroup = groupedMessages.at(-2)
			const isSecondToLast = Array.isArray(secondToLastGroup)
				? secondToLastGroup[0].ts === ts
				: secondToLastGroup?.ts === ts

			const isLastCollapsedApiReq =
				isLast &&
				!Array.isArray(lastGroup) &&
				lastGroup?.say === "api_req_started" &&
				!expandedRows[lastGroup.ts]

			setExpandedRows((prev) => ({
				...prev,
				[ts]: !prev[ts],
			}))

			if (!isCollapsing) {
				disableAutoScrollRef.current = true
			}

			if (isCollapsing && isAtBottom) {
				const timer = setTimeout(() => {
					scrollToBottomAuto()
				}, 0)
				return () => clearTimeout(timer)
			} else if (isLast || isSecondToLast) {
				if (isCollapsing) {
					if (isSecondToLast && !isLastCollapsedApiReq) {
						return
					}
					const timer = setTimeout(() => {
						scrollToBottomAuto()
					}, 0)
					return () => clearTimeout(timer)
				} else {
					const timer = setTimeout(() => {
						virtuosoRef.current?.scrollToIndex({
							index: groupedMessages.length - (isLast ? 1 : 2),
							align: "start",
						})
					}, 0)
					return () => clearTimeout(timer)
				}
			}
		},
		[groupedMessages, expandedRows, scrollToBottomAuto, isAtBottom],
	)

	const handleRowHeightChange = useCallback(
		(isTaller: boolean) => {
			if (!disableAutoScrollRef.current) {
				if (isTaller) {
					scrollToBottomSmooth()
				} else {
					setTimeout(() => {
						scrollToBottomAuto()
					}, 0)
				}
			}
		},
		[scrollToBottomSmooth, scrollToBottomAuto],
	)

	useEffect(() => {
		if (!disableAutoScrollRef.current) {
			setTimeout(() => {
				scrollToBottomSmooth()
			}, 50)
		}
	}, [groupedMessages.length, scrollToBottomSmooth])

	const handleWheel = useCallback((event: Event) => {
		const wheelEvent = event as WheelEvent
		if (wheelEvent.deltaY && wheelEvent.deltaY < 0) {
			if (scrollContainerRef.current?.contains(wheelEvent.target as Node)) {
				disableAutoScrollRef.current = true
			}
		}
	}, [])
	useEvent("wheel", handleWheel, window, { passive: true })

	const itemContent = useCallback(
		(index: number, messageOrGroup: JarvisIdeMessage | JarvisIdeMessage[]) => {
			if (Array.isArray(messageOrGroup)) {
				return (
					<BrowserSessionRow
						messages={messageOrGroup}
						isLast={index === groupedMessages.length - 1}
						lastModifiedMessage={modifiedMessages.at(-1)}
						onHeightChange={handleRowHeightChange}
						isExpanded={(messageTs: number) => expandedRows[messageTs] ?? false}
						onToggleExpand={(messageTs: number) => {
							setExpandedRows((prev) => ({
								...prev,
								[messageTs]: !prev[messageTs],
							}))
						}}
					/>
				)
			}

			return (
				<ChatRow
					key={messageOrGroup.ts}
					message={messageOrGroup}
					isExpanded={expandedRows[messageOrGroup.ts] || false}
					onToggleExpand={() => toggleRowExpansion(messageOrGroup.ts)}
					lastModifiedMessage={modifiedMessages.at(-1)}
					isLast={index === groupedMessages.length - 1}
					onHeightChange={handleRowHeightChange}
				/>
			)
		},
		[expandedRows, modifiedMessages, groupedMessages.length, toggleRowExpansion, handleRowHeightChange],
	)

	const handleSelectImages = useCallback(() => {
		vscode.postMessage({ type: "selectImages" })
	}, [])

	if (!selectedTask || isHidden) {
		return null
	}

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: isHidden ? "none" : "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}>
			<HistoryControls>
				<VSCodeButton
					appearance="secondary"
					onClick={() => vscode.postMessage({ type: "clearChatHistory" })}
				>
					Cancella Cronologia
				</VSCodeButton>
				<VSCodeButton
					appearance="secondary" 
					onClick={handleExportChat}
				>
					Esporta in Markdown
				</VSCodeButton>
			</HistoryControls>

			{task ? (
				<TaskHeader
					task={selectedTask}
					tokensIn={apiMetrics.totalTokensIn}
					tokensOut={apiMetrics.totalTokensOut}
					cacheWrites={apiMetrics.totalCacheWrites}
					cacheReads={apiMetrics.totalCacheReads}
					totalCost={apiMetrics.totalCost}
					lastApiReqTotalTokens={lastApiReqTotalTokens}
					onClose={handleCancelStreamingClick}
					apiConfiguration={apiConfiguration}
				/>
			) : (
				<div
					style={{
						flex: "1 1 0",
						minHeight: 0,
						overflowY: "auto",
						display: "flex",
						flexDirection: "column",
						paddingBottom: "10px",
					}}>
					{telemetrySetting === "unset" && <TelemetryBanner />}

					{showAnnouncement && <Announcement version={version} hideAnnouncement={hideAnnouncement} />}

					<div style={{ padding: "0 20px", flexShrink: 0 }}>
						<h2>What can I do for you?</h2>
						<p>
							Thanks to{" "}
							<VSCodeLink href="https://www.anthropic.com/claude/sonnet" style={{ display: "inline" }}>
								Claude 3.7 Sonnet's
							</VSCodeLink>
							agentic coding capabilities, I can handle complex software development tasks step-by-step. With tools
							that let me create & edit files, explore complex projects, use a browser, and execute terminal
							commands (after you grant permission), I can assist you in ways that go beyond code completion or tech
							support. I can even use MCP to create new tools and extend my own capabilities.
						</p>
					</div>
					{taskHistory.length > 0 && <HistoryPreview showHistoryView={showHistoryView} />}
				</div>
			)}

			{!task && (
				<AutoApproveMenu
					style={{
						marginBottom: -2,
						flex: "0 1 auto",
						minHeight: 0,
					}}
				/>
			)}

			{task && (
				<>
					<div style={{ flexGrow: 1, display: "flex" }} ref={scrollContainerRef}>
						<Virtuoso
							ref={virtuosoRef}
							key={task.ts}
							className="scrollable"
							style={{
								flexGrow: 1,
								overflowY: "scroll",
							}}
							components={{
								Footer: () => <div style={{ height: 5 }} />,
							}}
							increaseViewportBy={{
								top: 3_000,
								bottom: Number.MAX_SAFE_INTEGER,
							}}
							data={groupedMessages}
							itemContent={itemContent}
							atBottomStateChange={(isAtBottom) => {
								setIsAtBottom(isAtBottom)
								if (isAtBottom) {
									disableAutoScrollRef.current = false
								}
								setShowScrollToBottom(disableAutoScrollRef.current && !isAtBottom)
							}}
							atBottomThreshold={10}
							initialTopMostItemIndex={groupedMessages.length - 1}
						/>
					</div>
					<AutoApproveMenu />
					{showScrollToBottom ? (
						<div
							style={{
								display: "flex",
								padding: "10px 15px 0px 15px",
							}}>
							<ScrollToBottomButton
								onClick={() => {
									scrollToBottomSmooth()
									disableAutoScrollRef.current = false
								}}>
								<span className="codicon codicon-chevron-down" style={{ fontSize: "18px" }}></span>
							</ScrollToBottomButton>
						</div>
					) : (
						<div
							style={{
								opacity:
									primaryButtonText || secondaryButtonText || isStreaming
										? enableButtons || (isStreaming && !didClickCancel)
											? 1
											: 0.5
										: 0,
								display: "flex",
								padding: `${primaryButtonText || secondaryButtonText || isStreaming ? "10" : "0"}px 15px 0px 15px`,
							}}>
							{primaryButtonText && !isStreaming && (
								<VSCodeButton
									appearance="primary"
									disabled={!enableButtons}
									style={{
										flex: secondaryButtonText ? 1 : 2,
										marginRight: secondaryButtonText ? "6px" : "0",
									}}
									onClick={handlePrimaryButtonClick}>
									{primaryButtonText}
								</VSCodeButton>
							)}
							{(secondaryButtonText || isStreaming) && (
								<VSCodeButton
									appearance="secondary"
									disabled={!enableButtons && !(isStreaming && !didClickCancel)}
									style={{
										flex: isStreaming ? 2 : 1,
										marginLeft: isStreaming ? 0 : "6px",
									}}
									onClick={handleRejectButtonClick}>
									{isStreaming ? "Cancel" : secondaryButtonText}
								</VSCodeButton>
							)}
						</div>
					)}
				</>
			)}
			<ChatTextArea
				inputValue={inputValue}
				setInputValue={setInputValue}
				textAreaDisabled={textAreaDisabled}
				placeholderText="Type a message..."
				selectedImages={selectedImages}
				setSelectedImages={setSelectedImages}
				onSend={(text) => handleSendMessage(text, selectedImages)}
				onSelectImages={handleSelectImages}
				shouldDisableImages={!modelInfo?.supportsImages}
				onHeightChange={(height) => handleRowHeightChange(height > 100)}
				apiConfiguration={apiConfiguration}
			/>
		</div>
	)
}

const ScrollToBottomButton = styled.div`
	background-color: color-mix(in srgb, var(--vscode-toolbar-hoverBackground) 55%, transparent);
	border-radius: 3px;
	overflow: hidden;
	cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;
	flex: 1;
	height: 25px;

	&:hover {
		background-color: color-mix(in srgb, var(--vscode-toolbar-hoverBackground) 90%, transparent);
	}

	&:active {
		background-color: color-mix(in srgb, var(--vscode-toolbar-hoverBackground) 70%, transparent);
	}
`

export default ChatView
