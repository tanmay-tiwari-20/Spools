import { useToast } from "@chakra-ui/toast";
import { createElement, useCallback } from "react";
import { FiAlertCircle, FiAlertTriangle, FiCheck, FiInfo, FiLoader, FiX } from "react-icons/fi";

const toastAppearance = {
  success: {
    Icon: FiCheck,
    accent: "bg-emerald-500",
    iconStyle: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  error: {
    Icon: FiAlertCircle,
    accent: "bg-rose-500",
    iconStyle: "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
  },
  warning: {
    Icon: FiAlertTriangle,
    accent: "bg-amber-500",
    iconStyle: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
  },
  loading: {
    Icon: FiLoader,
    accent: "bg-indigo-500",
    iconStyle: "bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300",
  },
  info: {
    Icon: FiInfo,
    accent: "bg-indigo-500",
    iconStyle: "bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300",
  },
};

const useShowToast = () => {
  const toast = useToast();

  const showToast = useCallback(
    (title, description, status) => {
      const appearance = toastAppearance[status] || toastAppearance.info;
      const { Icon } = appearance;
      toast({
        position: "top",
        duration: 3600,
        isClosable: false,
        render: ({ onClose }) => createElement(
          "div",
          {
            role: status === "error" ? "alert" : "status",
            className: "pointer-events-auto relative mx-3 mt-3 flex w-[min(420px,calc(100vw-24px))] items-start gap-3 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 p-3.5 pl-4 text-zinc-900 shadow-xl shadow-zinc-950/10 backdrop-blur-xl dark:border-zinc-700/90 dark:bg-zinc-900/95 dark:text-zinc-100 dark:shadow-black/30",
          },
          createElement("span", {
            "aria-hidden": true,
            className: `absolute inset-y-3 left-0 w-[3px] rounded-r-full ${appearance.accent}`,
          }),
          createElement(
            "span",
            { className: `grid h-9 w-9 shrink-0 place-items-center rounded-xl ${appearance.iconStyle}` },
            createElement(Icon, { className: status === "loading" ? "animate-spin" : "", size: 18 })
          ),
          createElement(
            "div",
            { className: "min-w-0 flex-1 pt-0.5" },
            createElement("p", { className: "text-sm font-bold leading-5" }, title),
            description && createElement(
              "p",
              { className: "mt-0.5 break-words text-xs leading-[1.4rem] text-zinc-600 dark:text-zinc-300" },
              description
            )
          ),
          createElement(
            "button",
            {
              type: "button",
              onClick: onClose,
              "aria-label": "Dismiss notification",
              className: "grid h-7 w-7 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
            },
            createElement(FiX, { size: 15 })
          )
        ),
      });
    },
    [toast]
  );

  return showToast;
};

export default useShowToast;
