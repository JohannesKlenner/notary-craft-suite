
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TreeNodeData {
  name: string;
  attributes?: { [key: string]: string };
  children?: TreeNodeData[];
}

interface FamilyTreeProps {
  data: TreeNodeData;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data) return;
    
    // Clear previous tree
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = 1000; // Large width for horizontal layout
    const height = 600;
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };
    
    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create the hierarchical tree layout
    const hierarchyData = d3.hierarchy(data);
    
    // Use the Reingold-Tilford algorithm for tree layout
    const treeLayout = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
      .nodeSize([80, 200]); // Adjust node sizing
    
    const treeData = treeLayout(hierarchyData);
    
    // Create links
    svg.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d => {
        return `M${d.source.y},${d.source.x}
                C${d.source.y + (d.target.y - d.source.y) / 2},${d.source.x}
                 ${d.source.y + (d.target.y - d.source.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      })
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-width", 1.5);
    
    // Create nodes
    const nodes = svg.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);
    
    // Draw node rectangles with different styles based on attributes
    nodes.append("rect")
      .attr("width", 150)
      .attr("height", d => {
        // Calculate height based on content
        const lineCount = d.data.attributes ? Object.keys(d.data.attributes).length + 1 : 1;
        return 40 + (lineCount * 14);
      })
      .attr("x", -75)
      .attr("y", d => {
        const lineCount = d.data.attributes ? Object.keys(d.data.attributes).length + 1 : 1;
        return -(40 + (lineCount * 14)) / 2;
      })
      .attr("rx", 5) // Rounded corners
      .attr("ry", 5)
      .attr("fill", d => {
        if (d.data.attributes?.role === 'erblasser') return "#3C8DC5";
        if (d.data.attributes?.tod) return "#f0f0f0"; // Light gray for deceased
        return "#ffffff";
      })
      .attr("stroke", d => {
        if (d.data.attributes?.role === 'erblasser') return "#2a6a9a";
        if (d.data.attributes?.tod) return "#cccccc";
        return "#ddd";
      })
      .attr("stroke-width", 1.5)
      .attr("filter", "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))");
    
    // Add name text
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => {
        const lineCount = d.data.attributes ? Object.keys(d.data.attributes).length + 1 : 1;
        return -((lineCount * 14) / 2) + 14;
      })
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", d => d.data.attributes?.role === 'erblasser' ? "#ffffff" : "#333")
      .text(d => d.data.name)
      .attr("class", d => d.data.attributes?.tod ? "deceased" : "");
    
    // Add attribute text
    nodes.each(function(d) {
      if (!d.data.attributes) return;
      
      let yOffset = -((Object.keys(d.data.attributes).length * 14) / 2) + 28;
      const textColor = d.data.attributes.role === 'erblasser' ? "#ffffff" : "#555";
      
      Object.entries(d.data.attributes).forEach(([key, value]) => {
        // Skip role attribute - it's just for styling
        if (key === 'role') return;
        
        // Format labels
        let label;
        switch(key) {
          case 'beziehung': label = 'Beziehung: '; break;
          case 'geburt': label = '⭐ '; break;
          case 'tod': label = '✝ '; break;
          case 'erbanteil': label = '💰 '; break;
          default: label = `${key}: `;
        }
        
        d3.select(this).append("text")
          .attr("text-anchor", "middle")
          .attr("dy", yOffset)
          .attr("font-size", "10px")
          .attr("fill", textColor)
          .text(`${label}${value}`);
        
        yOffset += 14;
      });
    });
    
    // Add deceased marker (cross) for deceased persons
    nodes.each(function(d) {
      if (d.data.attributes?.tod) {
        d3.select(this).select("text")
          .attr("text-decoration", "line-through")
          .attr("fill", "#777");
      }
    });
    
  }, [data]);
  
  return (
    <div className="family-tree-container w-full overflow-auto">
      <svg ref={svgRef} className="family-tree"></svg>
    </div>
  );
};
