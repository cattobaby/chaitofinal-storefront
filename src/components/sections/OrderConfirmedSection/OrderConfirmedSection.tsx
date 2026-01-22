import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

export const OrderConfirmedSection = ({
  order,
}: {
  order: HttpTypes.StoreOrder
}) => {
  return (
    <div className="py-6">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full mx-auto">
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <div className="text-center w-full">
            <Heading
              level="h1"
              className="flex flex-col gap-y-3 text-green-700 text-3xl mb-4"
            >
              <span>¡Gracias!</span>
              <span>Tu pedido se realizó con éxito.</span>
            </Heading>

            <Text>
              Hemos enviado los detalles de confirmación del pedido a{" "}
              <span
                className="text-ui-fg-medium-plus font-semibold"
                data-testid="order-email"
              >
                {order.email}
              </span>
              .
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}