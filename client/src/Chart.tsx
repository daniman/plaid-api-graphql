import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import moment from "moment";

const PADDING = 35; // pixels

export const Chart: React.FC<{
  data: {
    x: Date;
    y: number;
    label: string;
  }[];
}> = ({ data }) => {
  const d3Container = useRef(null);

  /**
   * The useEffect hooks is running side effects outside of React,
   * like inserting elements into the DOM using D3.
   */
  useEffect(
    () => {
      if (d3Container && d3Container.current) {
        const svg = d3.select(d3Container.current);

        const [xMin, xMax] = [
          data
            .map((d) => d.x)
            .reduce(function (a, b) {
              return a < b ? a : b;
            }),
          data
            .map((d) => d.x)
            .reduce(function (a, b) {
              return a > b ? a : b;
            }),
        ];
        const x = d3
          .scaleTime()
          .domain([xMin, xMax])
          // @ts-ignore
          .range([1.5 * PADDING, d3Container.current.clientWidth - PADDING]);

        const [dyMin, dyMax] = [
          Math.min(...data.map((d) => d.y)),
          Math.max(...data.map((d) => d.y)),
        ];
        const yStep = 1000;
        const [yMin, yMax] = [dyMin - yStep, dyMax + yStep];
        const y = d3
          .scaleLinear()
          .domain([yMax, yMin])
          // @ts-ignore
          .range([PADDING, d3Container.current.clientHeight - 1.5 * PADDING]);

        // x-axis grid
        if (!svg.selectAll("g.x-axis").size())
          svg.append("g").attr("class", "x-axis");
        const xAxisGroup = svg.select("g.x-axis");
        const xLines = xAxisGroup
          .selectAll("line")
          .data([xMin, ...x.ticks(), xMax]);
        const xLabels = xAxisGroup
          .selectAll("text")
          .data([xMin, ...x.ticks(), xMax]);
        xLines
          .enter()
          .append("line")
          .attr("stroke", "#eee")
          .attr("stroke-dasharray", 2)
          .attr("x1", (d) => x(d))
          .attr("x2", (d) => x(d))
          .attr("y1", (d) => y(yMin))
          .attr("y2", (d) => y(yMax));
        xLines
          .attr("x1", (d) => x(d))
          .attr("x2", (d) => x(d))
          .attr("y1", (d) => y(yMin))
          .attr("y2", (d) => y(yMax));
        xLabels
          .enter()
          .append("text")
          .attr("font-size", 8)
          .attr("fill", "#aaa")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "hanging")
          .attr("x", (d) => x(d))
          .attr("y", (d) => y(yMin) + 6)
          .text((d) => `${moment(d).format("MMM DD")}`);
        xLabels
          .attr("x", (d) => x(d))
          .attr("y", (d) => y(yMin) + 6)
          .text((d) => `${moment(d).format("MMM DD")}`);
        xLines.exit().remove();
        xLabels.exit().remove();

        // y-axis grid
        if (!svg.selectAll("g.y-axis").size())
          svg.append("g").attr("class", "y-axis");
        const yAxisGroup = svg.select("g.y-axis");
        const yLines = yAxisGroup
          .selectAll("line")
          .data([yMin, 0, ...y.ticks(), yMax]);
        const yLabels = yAxisGroup
          .selectAll("text")
          .data([yMin, 0, ...y.ticks(), yMax]);
        yLines
          .enter()
          .append("line")
          .attr("stroke", (d) => (d === 0 ? "#03A9F4" : "#eee"))
          .attr("stroke-dasharray", 2)
          .attr("x1", x(xMin))
          .attr("x2", (d) => x(xMax))
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d));
        yLines
          .attr("stroke", (d) => (d === 0 ? "#03A9F4" : "#eee"))
          .attr("x1", x(xMin))
          .attr("x2", (d) => x(xMax))
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d));
        yLabels
          .enter()
          .append("text")
          .attr("font-size", 8)
          .attr("fill", (d) => (d === 0 ? "#03A9F4" : "#aaa"))
          .attr("text-anchor", "end")
          .attr("alignment-baseline", "middle")
          .attr("x", x(xMin) - 6)
          .attr("y", (d) => y(d))
          .text((d) => `$${d.toLocaleString()}`);
        yLabels
          .attr("fill", (d) => (d === 0 ? "#03A9F4" : "#aaa"))
          .attr("x", x(xMin) - 6)
          .attr("y", (d) => y(d))
          .text((d) => `$${d.toLocaleString()}`);
        yLines.exit().remove();
        yLabels.exit().remove();

        // lines to plot
        if (!svg.selectAll("g.lines").size())
          svg.append("g").attr("class", "lines");
        const linesGroup = svg.select("g.lines");
        const lines = linesGroup.selectAll("polyline").data([data]);
        lines
          .enter()
          .append("polyline")
          .attr("fill", "transparent")
          .attr("stroke", (d) => "#666")
          .attr("stroke-width", 1)
          .attr("points", (data) =>
            Object.values(data)
              .map((d) => `${x(d.x)},${y(d.y)}`)
              .join(" ")
          );
        lines.attr("points", (d) =>
          Object.values(data)
            .map((d) => `${x(d.x)},${y(d.y)}`)
            .join(" ")
        );
        lines.exit().remove();

        // points to plot in the form of dots
        if (!svg.selectAll("g.dots").size())
          svg.append("g").attr("class", "dots");
        const dotsGroup = svg.select("g.dots");
        const dots = dotsGroup.selectAll("circle").data(data);
        dots
          .enter()
          .append("circle")
          .attr("r", 3)
          .attr("cx", (d) => x(d.x))
          .attr("cy", (d) => y(d.y))
          .attr("fill", "#666")
          .append("title")
          .text(
            (d) =>
              `${moment(d.x).format(
                "MMM DD, YYYY"
              )}: $${d.y.toLocaleString()}\n${d.label}`
          );
        dots
          .attr("cx", (d) => x(d.x))
          .attr("cy", (d) => y(d.y))
          .select("title")
          .text(
            (d) =>
              `${moment(d.x).format(
                "MMM DD, YYYY"
              )}: $${d.y.toLocaleString()}\n${d.label}`
          );
        dots.exit().remove();
      }
    },

    /**
     * Run this block of code whenever these variables change. We need to check
     * if the variables are valid, but we no longer need to compare old props to
     * new props to decide wether to re-render.
     */
    [data]
  );

  return (
    <svg
      style={{ border: "1px solid #eee", height: 400 }}
      className="d3-component"
      width="100%"
      height="100%"
      ref={d3Container}
    />
  );
};
