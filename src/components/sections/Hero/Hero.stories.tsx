import type { Meta, StoryObj } from "@storybook/react"

import { Hero } from "./Hero"

const meta: Meta<typeof Hero> = {
    component: Hero,
    decorators: (Story) => <Story />,
}

export default meta
type Story = StoryObj<typeof Hero>

export const FirstStory: Story = {
    args: {
        heading: "Atrapa tu estilo al instante",
        paragraph: "Compra, vende y descubre prendas de segunda mano de las marcas más trendy.",
        image: "/images/hero/Image.jpg",
        buttons: [
            { label: "Comprar ahora", path: "#" },
            { label: "Vender ahora", path: "3" },
        ],
    },
}
