import {
    batch,
    createEffect,
    createSignal,
    on,
    onCleanup,
    onMount,
    Show,
    For,
    Index,
} from "solid-js"
import { createStore } from "solid-js/store"
import { makePersisted } from "@solid-primitives/storage"
import AnnotatedEditor from "../editor/AnnotatedEditor"
import { generateSuggestions } from "../ai/suggestions"
import defaults from "../styleguides/defaults"
import Text from "../components/Text"
import TextInput from "../components/TextInput"
import PlusIcon from "../components/icons/PlusIcon"
import CheckIcon from "../components/icons/CheckIcon"
import OverflowMargin from "../components/OverflowMargin"
import Card from "../components/Card"
import GearIcon from "../components/icons/GearIcon"
import SpinnerIcon from "../components/icons/SpinnerIcon"
import Button from "../components/Button"
import XIcon from "../components/icons/XIcon"

const RED_COLOR = "#EA1437"

const GENERATION_DEBOUNCE = 2000

export default function App() {
    const [state, setState] = makePersisted(
        createStore<{
            text: string
            styleguideIndex: number
            styleguides: {
                name: string
                rules: string[]
            }[]
            anthropicApiKey?: string
            anthropicApiKeySet: boolean
            suggestions: {
                id: number
                start: number
                end: number
                title: string
                content: string
                color: `#${string}`
            }[]
        }>({
            text: "",
            styleguideIndex: 0,
            styleguides: defaults,
            anthropicApiKey: undefined,
            anthropicApiKeySet: false,
            suggestions: [],
        }),
        { name: "AppState" },
    )

    const [editingStyleguideName, setEditingStyleguideName] =
        createSignal(false)

    const [generating, setGenerating] = createSignal(false)

    let generationTimeout: NodeJS.Timeout | undefined = undefined
    const resetGenerationTimeout = () => {
        if (!state.anthropicApiKeySet) return
        const anthropicApiKey = state.anthropicApiKey
        if (!anthropicApiKey) return

        clearTimeout(generationTimeout)

        generationTimeout = setTimeout(async () => {
            setGenerating(true)
            const suggestions = await generateSuggestions({
                content: state.text,
                rules: state.styleguides[state.styleguideIndex]!.rules,
                apiKey: anthropicApiKey,
            }).catch((error) => {
                alert(JSON.stringify(error))
                return []
            })
            setGenerating(false)

            const idOffset = (state.suggestions.at(-1)?.id ?? -1) + 1

            setState({
                suggestions: suggestions.map((suggestion, index) => ({
                    id: idOffset + index,
                    ...suggestion,
                    color: RED_COLOR,
                })),
            })
        }, GENERATION_DEBOUNCE)
    }

    return (
        <main class="h-[100dvh] space-y-2 p-8">
            <div class="flex justify-between">
                <div class="flex w-72 justify-between">
                    <Text variant="heading-1" class="text-base">
                        Suggestions
                    </Text>
                    <div class="flex items-center space-x-2">
                        <Show when={generating()}>
                            <SpinnerIcon class="size-4 text-text" />
                        </Show>
                        <Show when={state.anthropicApiKeySet}>
                            <Button
                                onClick={() =>
                                    setState({ anthropicApiKeySet: false })
                                }
                                variant="text"
                                class="rounded-md p-1"
                            >
                                <GearIcon class="size-4 text-text" />
                            </Button>
                        </Show>
                    </div>
                </div>
                <div class="flex w-72">
                    <Text variant="heading-1" class="text-base">
                        Rules
                    </Text>
                    <OverflowMargin
                        marginTop={2}
                        marginBottom={2}
                        class="flex-1"
                    >
                        <div class="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />

                        {(() => {
                            let ref: HTMLDivElement

                            let mounted = false

                            createEffect(
                                on(
                                    () => state.styleguideIndex,
                                    () => {
                                        ref.firstElementChild?.children[
                                            state.styleguideIndex
                                        ]!.scrollIntoView({
                                            block: "nearest",
                                            inline: !mounted
                                                ? "center"
                                                : "nearest",
                                        })

                                        mounted = true
                                    },
                                ),
                            )

                            createEffect(
                                on(
                                    () => state.styleguides.length,
                                    () => {
                                        const firstElementChild =
                                            ref.firstElementChild as HTMLElement

                                        firstElementChild.style.paddingLeft = `${Math.max(
                                            80,
                                            ref.scrollWidth -
                                                firstElementChild.clientWidth,
                                        )}px`
                                    },
                                ),
                            )

                            createEffect(
                                on(
                                    () => [
                                        editingStyleguideName(),
                                        state.styleguideIndex,
                                    ],
                                    () => {
                                        if (editingStyleguideName()) {
                                            const input = ref.querySelector(
                                                "input",
                                            ) as HTMLInputElement
                                            input?.focus()
                                            input?.select()

                                            ref.firstElementChild?.children[
                                                state.styleguideIndex
                                            ]!.scrollIntoView({
                                                block: "nearest",
                                                inline: "center",
                                            })
                                        }
                                    },
                                ),
                            )

                            return (
                                <div
                                    ref={ref!}
                                    class="scrollbar-none relative overflow-x-auto"
                                >
                                    <div class="flex h-7 w-max items-center space-x-1">
                                        <For each={state.styleguides}>
                                            {(styleguide, index) => (
                                                <Show
                                                    when={
                                                        editingStyleguideName() &&
                                                        state.styleguideIndex ===
                                                            index()
                                                    }
                                                    fallback={
                                                        <Button
                                                            onClick={() =>
                                                                state.styleguideIndex !==
                                                                index()
                                                                    ? setState(
                                                                          "styleguideIndex",
                                                                          index(),
                                                                      )
                                                                    : setEditingStyleguideName(
                                                                          true,
                                                                      )
                                                            }
                                                            variant={
                                                                state.styleguideIndex ===
                                                                index()
                                                                    ? "solid"
                                                                    : "text"
                                                            }
                                                            class="rounded-md px-1.5 py-1"
                                                        >
                                                            <Text
                                                                variant="label"
                                                                as="p"
                                                                class="text-xs"
                                                            >
                                                                {
                                                                    styleguide.name
                                                                }
                                                            </Text>
                                                        </Button>
                                                    }
                                                >
                                                    <>
                                                        <TextInput
                                                            value={
                                                                styleguide.name
                                                            }
                                                            onInput={(
                                                                styleguideName,
                                                            ) =>
                                                                setState(
                                                                    "styleguides",
                                                                    index(),
                                                                    "name",
                                                                    styleguideName,
                                                                )
                                                            }
                                                            onKeyDown={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    event.key ===
                                                                        "Enter" ||
                                                                    event.key ===
                                                                        "Escape"
                                                                ) {
                                                                    setEditingStyleguideName(
                                                                        false,
                                                                    )
                                                                    event.preventDefault()
                                                                }
                                                            }}
                                                            class="w-20 rounded-md px-1.5 py-[3px] text-xs"
                                                        />
                                                        <Button
                                                            onClick={() =>
                                                                setEditingStyleguideName(
                                                                    false,
                                                                )
                                                            }
                                                            class="rounded-md p-1"
                                                        >
                                                            <CheckIcon class="size-4 text-text" />
                                                        </Button>
                                                        <Show
                                                            when={
                                                                state
                                                                    .styleguides
                                                                    .length > 1
                                                            }
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    const newStyleguideIndex =
                                                                        Math.max(
                                                                            0,
                                                                            state.styleguideIndex -
                                                                                1,
                                                                        )

                                                                    batch(
                                                                        () => {
                                                                            setState(
                                                                                "styleguides",
                                                                                (
                                                                                    styleguides,
                                                                                ) =>
                                                                                    styleguides.filter(
                                                                                        (
                                                                                            _,
                                                                                            index,
                                                                                        ) =>
                                                                                            index !==
                                                                                            state.styleguideIndex,
                                                                                    ),
                                                                            )

                                                                            setState(
                                                                                "styleguideIndex",
                                                                                newStyleguideIndex,
                                                                            )

                                                                            setEditingStyleguideName(
                                                                                false,
                                                                            )
                                                                        },
                                                                    )
                                                                }}
                                                                class="rounded-md p-1"
                                                            >
                                                                <XIcon class="size-4 text-text" />
                                                            </Button>
                                                        </Show>
                                                    </>
                                                </Show>
                                            )}
                                        </For>
                                        <Button
                                            onClick={() => {
                                                const newStyleguideIndex =
                                                    state.styleguides.length
                                                const newStyleguideName = `styleguide ${newStyleguideIndex + 1}`

                                                batch(() => {
                                                    setState(
                                                        "styleguides",
                                                        newStyleguideIndex,
                                                        {
                                                            name: newStyleguideName,
                                                            rules: [""],
                                                        },
                                                    )

                                                    setState(
                                                        "styleguideIndex",
                                                        newStyleguideIndex,
                                                    )
                                                })

                                                setEditingStyleguideName(true)

                                                ref.scrollLeft = ref.scrollWidth
                                            }}
                                            variant="text"
                                            class="rounded-md p-1"
                                        >
                                            <PlusIcon class="size-4 stroke-[2.625] text-text" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })()}
                    </OverflowMargin>
                </div>
            </div>
            <div class="flex space-x-4">
                <OverflowMargin
                    marginBottom={22}
                    marginLeft={12}
                    class="w-[calc(100vw-288px-16px-64px)]"
                >
                    <div class="scrollbar-none flex h-[calc(100dvh-24px-8px-64px+22px)] space-x-4 overflow-y-auto pb-[22px] pl-3">
                        <AnnotatedEditor
                            text={state.text}
                            onChangeText={(text) => {
                                setState({ text })

                                resetGenerationTimeout()
                            }}
                            annotations={state.suggestions}
                            onChangeAnnotations={(annotations) =>
                                setState({ suggestions: annotations })
                            }
                            fallback={
                                <Card class="flex h-full w-full flex-col items-center justify-center">
                                    <Show
                                        when={state.anthropicApiKeySet}
                                        fallback={
                                            <div class="space-y-4 text-center">
                                                <Text
                                                    variant="text"
                                                    class="text-lg font-medium+"
                                                >
                                                    Enter your Anthropic API key
                                                </Text>
                                                <div class="flex space-x-2">
                                                    <TextInput
                                                        value={
                                                            state.anthropicApiKey ??
                                                            ""
                                                        }
                                                        onInput={(
                                                            anthropicApiKey,
                                                        ) =>
                                                            setState({
                                                                anthropicApiKey,
                                                            })
                                                        }
                                                        autoFocus
                                                        spellcheck={false}
                                                    />
                                                    <Button
                                                        onClick={() =>
                                                            setState({
                                                                anthropicApiKeySet:
                                                                    true,
                                                            })
                                                        }
                                                        disabled={
                                                            !state.anthropicApiKey
                                                        }
                                                        class="p-2"
                                                    >
                                                        <CheckIcon class="size-6 text-text" />
                                                    </Button>
                                                </div>
                                                <Text
                                                    variant="subtext"
                                                    class="text-xs"
                                                >
                                                    Stored locally in your
                                                    browser.
                                                </Text>
                                            </div>
                                        }
                                    >
                                        <Text
                                            variant="text"
                                            class="text-lg font-medium+"
                                        >
                                            No suggestions yet!
                                        </Text>

                                        <Text variant="subtext" class="text-sm">
                                            Suggestions will appear here.
                                        </Text>
                                    </Show>
                                </Card>
                            }
                            autoFocus
                            class="max-w-[calc(100vw-576px-32px-64px)] flex-1"
                        />
                    </div>
                </OverflowMargin>
                <OverflowMargin margin={2}>
                    <div class="scrollbar-none h-[calc(100dvh-24px-8px-64px)] w-72 space-y-2 overflow-y-auto p-0.5">
                        <Show when={state.styleguideIndex || -1} keyed>
                            <Index
                                each={
                                    state.styleguides[state.styleguideIndex]!
                                        .rules
                                }
                            >
                                {(rule, index) => {
                                    let ref: HTMLTextAreaElement

                                    onMount(() => {
                                        if (
                                            index ===
                                                state.styleguides[
                                                    state.styleguideIndex
                                                ]!.rules.length -
                                                    1 &&
                                            rule() === "" &&
                                            !editingStyleguideName()
                                        ) {
                                            ref.focus()
                                        }
                                    })

                                    onCleanup(() => {
                                        if (
                                            ref.previousElementSibling instanceof
                                            HTMLElement
                                        ) {
                                            ref.previousElementSibling.focus()
                                        }
                                    })

                                    return (
                                        <TextInput
                                            ref={ref!}
                                            value={rule()}
                                            onInput={(rule) =>
                                                setState(
                                                    "styleguides",
                                                    state.styleguideIndex,
                                                    "rules",
                                                    index,
                                                    rule,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Backspace" &&
                                                    rule().length === 0
                                                ) {
                                                    event.preventDefault()

                                                    setState(
                                                        "styleguides",
                                                        state.styleguideIndex,
                                                        "rules",
                                                        (rules) =>
                                                            rules.filter(
                                                                (_, i) =>
                                                                    i !== index,
                                                            ),
                                                    )
                                                }
                                            }}
                                            expanding
                                            class="w-full"
                                        />
                                    )
                                }}
                            </Index>
                        </Show>
                        <Button
                            onClick={() =>
                                setState(
                                    "styleguides",
                                    state.styleguideIndex,
                                    "rules",
                                    state.styleguides[state.styleguideIndex]!
                                        .rules.length,
                                    "",
                                )
                            }
                            class="w-full"
                        >
                            <PlusIcon class="size-5 text-text" />
                        </Button>
                    </div>
                </OverflowMargin>
            </div>
        </main>
    )
}
