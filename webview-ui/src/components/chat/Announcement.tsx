import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { memo } from "react"
import { getAsVar, VSC_DESCRIPTION_FOREGROUND, VSC_INACTIVE_SELECTION_BACKGROUND } from "../../utils/vscStyles"

interface AnnouncementProps {
	version: string
	hideAnnouncement: () => void
}

/*
You must update the latestAnnouncementId in JarvisIdeProvider for new announcements to show to users. This new id will be compared with whats in state for the 'last announcement shown', and if it's different then the announcement will render. As soon as an announcement is shown, the id will be updated in state. This ensures that announcements are not shown more than once, even if the user doesn't close it themselves.
*/
const Announcement = ({ version, hideAnnouncement }: AnnouncementProps) => {
	const minorVersion = version.split(".").slice(0, 2).join(".") // 2.0.0 -> 2.0
	return (
		<div
			style={{
				backgroundColor: getAsVar(VSC_INACTIVE_SELECTION_BACKGROUND),
				borderRadius: "3px",
				padding: "12px 16px",
				margin: "5px 15px 5px 15px",
				position: "relative",
				flexShrink: 0,
			}}>
			<VSCodeButton appearance="icon" onClick={hideAnnouncement} style={{ position: "absolute", top: "8px", right: "8px" }}>
				<span className="codicon codicon-close"></span>
			</VSCodeButton>
			<h3 style={{ margin: "0 0 8px" }}>
				🎉{"  "}New in v{minorVersion}
			</h3>
			<ul style={{ margin: "0 0 8px", paddingLeft: "12px" }}>
				<li>
					<b>Add to Jarvis:</b> Right-click selected text in any file or terminal to quickly add context to your current
					task! Plus, when you see a lightbulb icon, select 'Fix with Jarvis' to have Jarvis fix errors in your code.
				</li>
				<li>
					<b>Billing Dashboard:</b> Track your remaining credits and transaction history right in the extension with a{" "}
					<span className="codicon codicon-account" style={{ fontSize: 11 }}></span> Jarvis account!
				</li>
				<li>
					<b>Faster Inference:</b> Jarvis/OpenRouter users can sort underlying providers used by throughput, price, and
					latency. Sorting by throughput will output faster generations (at a higher cost).
				</li>
				<li>
					<b>Enhanced MCP Support:</b> Dynamic image loading with GIF support, and a new delete button to clean up
					failed servers.
				</li>
			</ul>
			<div
				style={{
					height: "1px",
					background: getAsVar(VSC_DESCRIPTION_FOREGROUND),
					opacity: 0.1,
					margin: "8px 0",
				}}
			/>
			<p style={{ margin: "0" }}>
				Join us on{" "}
				<VSCodeLink style={{ display: "inline" }} href="https://x.com/jarvis-ide">
					X,
				</VSCodeLink>{" "}
				<VSCodeLink style={{ display: "inline" }} href="https://discord.gg/jarvis-ide">
					discord,
				</VSCodeLink>{" "}
				or{" "}
				<VSCodeLink style={{ display: "inline" }} href="https://www.reddit.com/r/jarvis-ide/">
					r/jarvis-ide
				</VSCodeLink>
				for more updates!
			</p>
		</div>
	)
}

export default memo(Announcement)
